#!/usr/bin/env python3
"""Smoke test for an Event Schedule install behind this bundle's proxy.

    ES_API_KEY=... ./smoke_test.py --base-url https://e-tex.events

Creates a throwaway curator schedule, venue, sub-schedule and two events through the API, checks
the public pages, feeds and sitemaps they produce, then deletes everything it created. Safe to
run against the live site: nothing it creates is named like real content, and the published
test event exists for well under a minute. Once real mail delivery is configured, the admin
account receives one "schedule deleted" email for each of the two schedules removed at the end.
Exits 0 only if every check passed.

Needs Python 3.8+ and nothing else. The API key is read from ES_API_KEY so it stays out of the
shell history and the process list; --api-key exists for one-off local runs.
"""

import argparse
import datetime
import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

STOCK_LLMS_HEADING = "# Event Schedule"
USER_AGENT = "etex-smoke-test/1"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


class Response:
    def __init__(self, status, headers, body):
        self.status = status
        self.headers = headers
        self.body = body

    @property
    def text(self):
        return self.body.decode("utf-8", errors="replace")

    def json(self):
        try:
            return json.loads(self.text)
        except ValueError:
            return None


class Client:
    def __init__(self, base_url, api_key, timeout):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def url(self, path):
        return self.base_url + path

    def local(self, absolute_url):
        """Path of a URL the app generated, re-rooted on the base URL under test.

        The app builds links from APP_URL. Re-rooting keeps the test pointed at the address it
        was given, which matters when that is a temporary hostname.
        """
        parts = urllib.parse.urlsplit(absolute_url)
        return parts.path + ("?" + parts.query if parts.query else "")

    def request(self, method, path, body=None, auth=False):
        headers = {"Accept": "application/json" if path.startswith("/api/") else "*/*",
                   "User-Agent": USER_AGENT}
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        if auth:
            headers["X-API-Key"] = self.api_key
        for attempt in (1, 2):
            req = urllib.request.Request(self.url(path), data=data, headers=headers, method=method)
            try:
                with OPENER.open(req, timeout=self.timeout) as raw:
                    resp = Response(raw.status, raw.headers, raw.read())
            except urllib.error.HTTPError as err:
                resp = Response(err.code, err.headers, err.read())
            # Writes are limited to 30 a minute per address. Wait once rather than fail a run
            # that happened to follow another one.
            if resp.status == 429 and attempt == 1:
                wait = min(int(resp.headers.get("Retry-After") or 30), 65)
                print(f"      rate limited, waiting {wait}s")
                time.sleep(wait)
                continue
            return resp
        return resp


class Run:
    def __init__(self):
        self.failures = []
        self.count = 0

    def check(self, label, ok, detail=""):
        self.count += 1
        print(f"{'ok  ' if ok else 'FAIL'}  {label}" + (f"  [{detail}]" if detail and not ok else ""))
        if not ok:
            self.failures.append(label)
        return ok


def robots_meta(html):
    match = re.search(r'<meta\s+name="robots"\s+content="([^"]*)"', html)
    return match.group(1) if match else ""


def json_ld_events(html):
    found = []
    for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except ValueError:
            continue
        for item in data if isinstance(data, list) else [data]:
            if isinstance(item, dict) and item.get("@type") == "Event":
                found.append(item)
    return found


def data_of(resp):
    payload = resp.json()
    return payload.get("data", {}) if isinstance(payload, dict) else {}


def brief(resp):
    return f"{resp.status} {resp.text[:200]!r}"


def check_static_files(client, run, allow_empty=False):
    """Read-only checks; exact seed/map comparison is also required by the publishing CLI."""
    responses = {}
    types = {"/events.json": ("application/json",), "/llms.txt": ("text/plain",),
             "/openapi.json": ("application/json",), "/sitemap-index.xml": ("application/xml", "text/xml")}
    for path, accepted in types.items():
        resp = client.request("GET", path)
        responses[path] = resp
        run.check(f"{path} status, content type and CORS",
                  resp.status == 200 and resp.headers.get("Content-Type", "").split(";")[0] in accepted
                  and resp.headers.get("Access-Control-Allow-Origin") == "*", brief(resp))
    feed = responses["/events.json"].json()
    events = feed.get("events") if isinstance(feed, dict) else None
    valid = isinstance(events, list) and (allow_empty or len(events) > 0)
    run.check("feed is nonempty (unless explicitly acknowledged)", valid)
    if isinstance(events, list):
        run.check("event_count matches actual events", type(feed.get("event_count")) is int and feed["event_count"] == len(events))
        try:
            generated = datetime.datetime.fromisoformat(feed["generated_at"].replace("Z", "+00:00"))
            age = (datetime.datetime.now(datetime.timezone.utc) - generated).total_seconds()
            fresh = -300 <= age <= 48 * 3600
        except (KeyError, ValueError, TypeError):
            fresh = False
        run.check("feed timestamp is fresh (48 hours) and not future-dated", fresh)
        ids = [event.get("id") for event in events if isinstance(event, dict)]
        pages = feed.get("calendar", {}).get("event_pages", {})
        run.check("events have unique IDs and active events have page mappings",
                  len(ids) == len(events) and all(isinstance(i, str) and i for i in ids)
                  and len(set(ids)) == len(ids) and isinstance(pages, dict)
                  and set(pages) == {event.get("id") for event in events if isinstance(event, dict) and event.get("status") != "cancelled"})
    guide = responses["/llms.txt"].text
    run.check("llms.txt is generated site guidance without placeholders",
              guide.startswith("# East Texas Events") and "placeholder" not in guide.lower()
              and isinstance(feed, dict) and f"Generated: {feed.get('generated_at')}" in guide
              and isinstance(events, list) and f"Upcoming events: {len(events)}" in guide)
    spec = responses["/openapi.json"].json()
    run.check("OpenAPI describes the public files", isinstance(spec, dict) and spec.get("openapi") == "3.1.0"
              and all(p in spec.get("paths", {}) for p in ("/events.json", "/llms.txt", "/sitemap-index.xml")))
    try:
        sitemap = ET.fromstring(responses["/sitemap-index.xml"].body)
        valid_xml = sitemap.tag == "{http://www.sitemaps.org/schemas/sitemap/0.9}sitemapindex" and bool(list(sitemap))
    except ET.ParseError:
        valid_xml = False
    run.check("sitemap index is valid, nonempty XML", valid_xml)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--base-url", default=os.environ.get("ES_BASE_URL"),
                        help="site address, e.g. https://e-tex.events (or ES_BASE_URL)")
    parser.add_argument("--api-key", default=os.environ.get("ES_API_KEY"),
                        help="owner API key; prefer the ES_API_KEY environment variable")
    parser.add_argument("--contact-email", default="smoke-test@e-tex.events",
                        help="address set on the throwaway schedules; the app sends it nothing")
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--static-only", action="store_true", help="read-only public file checks; no API key or writes")
    parser.add_argument("--allow-empty", action="store_true", help="explicitly acknowledge a legitimately empty upcoming feed")
    parser.add_argument("--keep", action="store_true",
                        help="leave the created schedules and events in place for inspection")
    args = parser.parse_args()
    if not args.base_url or (not args.api_key and not args.static_only):
        parser.error("--base-url and an API key (ES_API_KEY) are required")

    client = Client(args.base_url, args.api_key, args.timeout)
    run = Run()
    if args.static_only:
        check_static_files(client, run, args.allow_empty)
        return 1 if run.failures else 0
    tag = secrets.token_hex(3)
    curator = venue = None
    event_ids = []

    try:
        # --- The proxy ---------------------------------------------------------------------
        resp = client.request("GET", "/up")
        run.check("app answers its health check (GET /up)", resp.status == 200, brief(resp))

        resp = client.request("GET", "/")
        location = resp.headers.get("Location", "")
        run.check("site root redirects to /calendar",
                  resp.status in (301, 302, 307, 308) and urllib.parse.urlsplit(location).path == "/calendar",
                  f"{resp.status} Location={location!r}")

        check_static_files(client, run, args.allow_empty)

        # --- The API -----------------------------------------------------------------------
        resp = client.request("GET", "/api/schedules")
        run.check("API refuses a request with no key", resp.status == 401, brief(resp))

        resp = client.request("GET", "/api/schedules", auth=True)
        if not run.check("API accepts the key", resp.status == 200, brief(resp)):
            raise SystemExit

        resp = client.request("POST", "/api/schedules", auth=True, body={
            "name": f"Smoketest{tag} Curator", "type": "curator", "timezone": "America/Chicago"})
        curator = data_of(resp).get("subdomain")
        if not run.check("create curator schedule", resp.status == 201 and bool(curator), brief(resp)):
            raise SystemExit
        run.check("curator schedule keeps the requested timezone",
                  data_of(resp).get("timezone") == "America/Chicago", str(data_of(resp).get("timezone")))

        resp = client.request("POST", "/api/schedules", auth=True, body={
            "name": f"Smoketest{tag} Hall", "type": "venue", "email": args.contact_email,
            "address1": "100 Test St", "city": "Longview", "state": "TX",
            "postal_code": "75601", "country_code": "us", "timezone": "America/Chicago"})
        venue = data_of(resp).get("subdomain")
        venue_id = data_of(resp).get("id")
        if not run.check("create venue schedule with an email", resp.status == 201 and bool(venue), brief(resp)):
            raise SystemExit

        resp = client.request("POST", f"/api/schedules/{curator}/groups", auth=True,
                              body={"name": f"Smoketest {tag} Nearby"})
        group_slug = data_of(resp).get("slug")
        run.check("create sub-schedule", resp.status == 201 and bool(group_slug), brief(resp))

        # A schedule with no email is served noindex; the curator was created without one.
        resp = client.request("GET", f"/{curator}")
        run.check("schedule with no email is noindex",
                  resp.status == 200 and "noindex" in robots_meta(resp.text),
                  f"{resp.status} robots={robots_meta(resp.text)!r}")

        resp = client.request("PUT", f"/api/schedules/{curator}", auth=True,
                              body={"email": args.contact_email})
        run.check("set the curator schedule's email", resp.status == 200, brief(resp))

        starts = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=21)).replace(
            hour=0, minute=0, second=0, microsecond=0)
        starts_at = starts.strftime("%Y-%m-%d %H:%M:%S")
        event_name = f"Smoketest {tag} Concert"
        event_body = {
            "name": event_name,
            "starts_at": starts_at,
            "duration": 2.5,
            "short_description": "Throwaway event created by the deployment smoke test.",
            "description": "Created by the deployment **smoke test** and deleted moments later.\n\n"
                           "Source: https://example.com/source",
            "registration_url": "https://example.com/tickets",
            "venue_id": venue_id,
        }
        if group_slug:
            event_body["schedule"] = group_slug

        # An event with a description is the request the stock Docker image answers with a 500.
        resp = client.request("POST", f"/api/events/{curator}", auth=True, body=event_body)
        event = data_of(resp)
        event_id = event.get("id")
        if not run.check("create event with a description", resp.status == 201 and bool(event_id), brief(resp)):
            raise SystemExit
        event_ids.append(event_id)
        event_path = client.local(event.get("url", ""))
        run.check("event URL sits under its venue's path",
                  event_path.startswith(f"/{venue}/"), event_path)

        resp = client.request("PUT", f"/api/events/{event_id}", auth=True, body={"duration": 3})
        run.check("update event", resp.status == 200 and float(data_of(resp).get("duration") or 0) == 3.0, brief(resp))

        resp = client.request("POST", f"/api/events/{curator}", auth=True, body={
            "name": "Nowhere", "starts_at": starts_at,
            "venue_name": f"Nowhere Hall {tag}", "venue_address1": "1 Missing Rd"})
        if resp.status == 201 and data_of(resp).get("id"):
            event_ids.append(data_of(resp)["id"])
        run.check("unknown venue name and address is refused, not auto-created", resp.status == 422, brief(resp))

        draft_name = f"Smoketest {tag} Draft"
        resp = client.request("POST", f"/api/events/{curator}", auth=True, body={
            "name": draft_name, "starts_at": starts_at, "duration": 1,
            "venue_id": venue_id, "is_draft": True})
        draft = data_of(resp)
        if run.check("create draft event", resp.status == 201 and draft.get("is_draft") is True, brief(resp)):
            event_ids.append(draft["id"])
            resp = client.request("GET", client.local(draft.get("url", "")))
            run.check("draft event page is hidden from visitors", resp.status == 404, str(resp.status))

        # --- Public pages ------------------------------------------------------------------
        for label, path in (("curator", f"/{curator}"), ("venue", f"/{venue}"), ("event", event_path)):
            resp = client.request("GET", path)
            robots = robots_meta(resp.text)
            run.check(f"{label} page is indexable (robots: index, follow)",
                      resp.status == 200 and "noindex" not in robots and "index" in robots,
                      f"{resp.status} robots={robots!r}")
            if label == "event":
                event_html = resp.text

        ld = json_ld_events(event_html)
        run.check("event page carries schema.org Event data", len(ld) == 1, f"{len(ld)} Event blocks")
        if ld:
            run.check("event is marked in-person only",
                      str(ld[0].get("eventAttendanceMode", "")).endswith("OfflineEventAttendanceMode")
                      and "VirtualLocation" not in json.dumps(ld[0]),
                      str(ld[0].get("eventAttendanceMode")))
            # 00:00 UTC is 19:00 the evening before in Central time (18:00 outside daylight time).
            run.check("event start is rendered in Central time",
                      re.search(r"T1[89]:00:00-0[56]:00$", str(ld[0].get("startDate", ""))) is not None,
                      str(ld[0].get("startDate")))
        canonical = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', event_html)
        run.check("event page has a canonical link under the venue path",
                  bool(canonical) and client.local(canonical.group(1)).startswith(f"/{venue}/"),
                  canonical.group(1) if canonical else "none")

        if group_slug:
            resp = client.request("GET", f"/{curator}?schedule={group_slug}")
            run.check("sub-schedule view loads", resp.status == 200, str(resp.status))

        # --- Feeds and sitemaps ------------------------------------------------------------
        resp = client.request("GET", f"/{curator}/feed/ical")
        run.check("iCal feed lists the published event",
                  resp.status == 200 and "text/calendar" in resp.headers.get("Content-Type", "")
                  and event_name in resp.text, f"{resp.status} {resp.headers.get('Content-Type')}")
        run.check("iCal feed leaves out the draft", draft_name not in resp.text)

        resp = client.request("GET", f"/{curator}/feed/rss")
        run.check("RSS feed lists the published event",
                  resp.status == 200 and "xml" in resp.headers.get("Content-Type", "")
                  and event_name in resp.text, f"{resp.status} {resp.headers.get('Content-Type')}")

        resp = client.request("GET", "/sitemap.xml")
        run.check("root sitemap is served", resp.status == 200 and "<sitemapindex" in resp.text, brief(resp))

        resp = client.request("GET", f"/{venue}/sitemap.xml")
        run.check("venue sitemap lists the event", resp.status == 200 and event_path in resp.text, brief(resp))

    except SystemExit:
        print("      stopping early: later checks depend on the one that failed")
    finally:
        if args.keep:
            print(f"      --keep: left schedules {curator!r} and {venue!r} in place")
        else:
            for event_id in event_ids:
                resp = client.request("DELETE", f"/api/events/{event_id}", auth=True)
                run.check(f"clean up: delete event {event_id}", resp.status == 200, brief(resp))
            for path in (venue, curator):
                if path:
                    resp = client.request("DELETE", f"/api/schedules/{path}", auth=True)
                    run.check(f"clean up: delete schedule {path}", resp.status == 200, brief(resp))

    passed = run.count - len(run.failures)
    print(f"\n{passed}/{run.count} checks passed against {client.base_url}")
    if run.failures:
        print("failed: " + "; ".join(run.failures))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
