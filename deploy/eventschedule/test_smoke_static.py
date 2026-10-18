"""Offline regressions for the read-only deployment checks."""
import datetime
import json
import unittest
import smoke_test as smoke


class StaticChecks(unittest.TestCase):
    def check_bundle(self, *, empty=False, stale=False, placeholder=False, count=1, missing=False):
        generated = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3 if stale else 0)
        feed = {'generated_at': generated.isoformat(), 'event_count': 0 if empty else count,
                'events': [] if empty else [{'id': 'evt_a', 'status': 'scheduled'}],
                'calendar': {'event_pages': {} if empty else {'evt_a': 'https://e-tex.events/v/e/1'}}}
        files = {'/events.json': json.dumps(feed),
                 '/llms.txt': 'placeholder' if placeholder else f'# East Texas Events\nGenerated: {generated.isoformat()}\nUpcoming events: {len(feed["events"])}\n',
                 '/openapi.json': json.dumps({'openapi': '3.1.0', 'paths': {'/events.json': {}, '/llms.txt': {}, '/sitemap-index.xml': {}}}),
                 '/sitemap-index.xml': '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://e-tex.events/calendar/sitemap.xml</loc></sitemap></sitemapindex>'}

        class Client:
            def request(self, method, path):
                return smoke.Response(404 if missing and path == '/openapi.json' else 200,
                                      {'Content-Type': 'application/json' if path.endswith('.json') else 'application/xml' if path.endswith('.xml') else 'text/plain', 'Access-Control-Allow-Origin': '*'}, files[path].encode())
        run = smoke.Run()
        smoke.check_static_files(Client(), run)
        return run.failures

    def test_valid(self):
        self.assertEqual(self.check_bundle(), [])

    def test_bad_bundles(self):
        for options in [{'empty': True}, {'stale': True}, {'placeholder': True}, {'count': 2}, {'missing': True}]:
            with self.subTest(options=options):
                self.assertTrue(self.check_bundle(**options))


if __name__ == '__main__':
    unittest.main()
