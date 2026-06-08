# East Texas Events Calendar Source Inventory

**Compiled:** May 11, 2026

**Center point:** `32.455117826436116, -94.93546354240058`

**Radius:** 60 miles

## Method and caveats

- Distance tiers are approximate straight-line/great-circle miles from the supplied coordinate to the source's host city, campus, district HQ, or nearest practical base community. They are **not driving distances**.
- This is a best-effort, scrape-ready inventory, not a legal certification that no source exists outside the list. Small venues and volunteer-run community pages often move between standalone sites, Facebook pages, and ticketing platforms.
- Rows tagged `city_directory_no_site` are municipalities found in regional/local government directories where no independent city website was confirmed during this pass; the directory page itself is included for contact/bootstrap purposes.
- For Facebook pages, scrape only where permitted by Facebook/Meta terms and robots/permissions; many FB event pages require API access or manual ingestion.
- Best first scrape targets: tourism/CVB calendars, chambers, city calendars, newspapers' event/community categories, venue schedules, school district calendars/athletics/fine arts, state parks, and ticketing aggregators.

## Tag glossary

Common tags include: `newspaper`, `tv_news`, `online_news`, `city_official`, `city_directory_no_site`, `city_facebook`, `county_government`, `school_district`, `tourism_cvb`, `chamber`, `music_venue`, `venue_facebook`, `performing_arts`, `festival`, `event_aggregator`, `state_park`, `college`, `museum`, `brewery`, `civic_venue`, and `public_notices`.

## Summary counts

- Total source rows: **315**
- 0-15 miles: **60**
- 16-30 miles: **75**
- 31-45 miles: **95**
- 46-60 miles: **85**

Broad category counts:
- venues/events/chambers/tourism/other: **99**
- city/municipal: **89**
- school districts: **83**
- newspapers/media: **26**
- county government: **18**

## Source inventory by distance tier

### 0-15 miles

| Miles | Place / base | Name | URL | Tags | Notes |
|---:|---|---|---|---|---|
| 5.5 | Clarksville City | City of Clarksville City | https://www.etcog.org/clarksville-city | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 5.6 | Gladewater | City of Gladewater | https://www.cityofgladewater.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 5.6 | Gladewater | Gladewater Chamber of Commerce | https://gladewaterchamber.com/ | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.6 | Gladewater | Gladewater ISD | https://www.gladewaterisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 5.6 | Gladewater | Gladewater Mirror | https://www.gladewatermirror.com/ | `newspaper, local_news, event_notices` | Weekly/local community notices. |
| 5.6 | Gladewater | Gladewater Opry venue reference | https://cinematreasures.org/theaters/21532 | `music_venue_directory, verify_current_page` | Venue is known locally; verify current Facebook/event source before scraping. |
| 5.6 | Gladewater | Gladewater Round-Up Rodeo | https://gladewaterrodeo.com/ | `festival, rodeo, annual_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | City of Kilgore | https://www.cityofkilgore.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 5.9 | Kilgore | Kilgore Chamber of Commerce | https://www.kilgorechamber.com/ | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | Kilgore Current Calendar | https://kilgorecurrent.com/category/current-events/calendar/ | `online_news, calendar, events` | Useful local calendar category. |
| 5.9 | Kilgore | Kilgore ISD | https://www.kisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 5.9 | Kilgore | Kilgore News Herald | https://kilgorenewsherald.com/ | `newspaper, local_news, event_notices` | Local news/events and community announcements. |
| 5.9 | Kilgore | Texan Theater Kilgore | https://www.facebook.com/TexanTheaterKilgore/ | `venue_facebook, theater, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | Texas Shakespeare Festival | https://www.texasshakespeare.com/ | `performing_arts, festival, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | The Back Porch Kilgore - Live Music | https://www.thebackporchkilgore.com/live-music | `music_venue, live_music, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | The Back Porch Stage - Eventbrite Organizer | https://www.eventbrite.com/o/the-back-porch-stage-62783609253 | `music_venue, ticketing, eventbrite` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 5.9 | Kilgore | Visit Kilgore Events | https://visitkilgore.com/events/ | `tourism_cvb, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 6.6 | White Oak | City of White Oak | https://cityofwhiteoak.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 6.6 | White Oak | Sabine ISD | https://www.sabineisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 6.6 | White Oak | White Oak ISD | https://www.woisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 7.1 | Warren City | City of Warren City | https://www.etcog.org/warren-city | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 9.0 | Union Grove | City of Union Grove | https://www.etcog.org/union-grove | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 9.0 | Union Grove | Union Grove ISD | https://www.ugisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 9.0 | Union Grove | Union Hill ISD | https://www.uhisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 10.7 | East Mountain | City of East Mountain | https://www.eastmountaintx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 11.8 | Longview | ArtsView Children's Theatre | https://artsviewchildrenstheatre.com/ | `performing_arts, theater, youth_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Bandsintown - Longview | https://www.bandsintown.com/c/longview-tx | `event_aggregator, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Belcher Center | https://www.belchercenter.com/ | `performing_arts, concert_venue, ticketed_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | City of Longview | https://www.longviewtexas.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 11.8 | Longview | City of Longview Calendar | https://www.longviewtexas.gov/Calendar.aspx | `city_official, municipal_calendar, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | East Texas Charter Schools | https://www.etchs.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 11.8 | Longview | East Texas Review | https://easttexasreview.com/ | `newspaper, regional_news, event_notices` | Longview-based regional/community publication. |
| 11.8 | Longview | Eventbrite - Longview Events | https://www.eventbrite.com/d/tx--longview/events/ | `event_aggregator, ticketing` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Great Texas Balloon Race | https://gtbr.net/ | `festival, annual_event, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Gregg County | https://greggcounty.texas.gov/ | `county_government, calendar, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 11.8 | Longview | LeTourneau University Events | https://www.letu.edu/events/ | `college, campus_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview Arboretum Calendar | https://longviewarboretum.org/calendar/ | `garden, civic_events, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview Arboretum Events | https://longviewarboretum.org/arboretum-events/ | `garden, civic_events, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview Chamber Events | https://business.longviewchamber.com/events | `chamber, business_events, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview Convention Complex Event Calendar | https://www.longviewtexas.gov/3930/Event-Calendar | `civic_venue, event_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview ISD | https://w3.lisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 11.8 | Longview | Longview Museum of Fine Arts | https://www.lmfa.org/ | `museum, arts, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Longview News-Journal | https://news-journal.com/ | `newspaper, local_news, event_notices` | Major regional daily; scrape events/arts/news calendars. |
| 11.8 | Longview | Longview Symphony | https://longviewsymphony.org/ | `performing_arts, symphony, concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Oil Horse Brewing Company Events | https://www.oilhorsebrewing.com/events/ | `brewery, live_music, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Pine Tree ISD | https://www.ptisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 11.8 | Longview | Spring Hill ISD | https://www.shisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 11.8 | Longview | Theatre Longview | https://theatrelongview.com/ | `performing_arts, theater, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Visit Longview - Downtown Live | https://www.visitlongviewtexas.com/258/Downtown-Live | `tourism_cvb, live_music, outdoor_concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 11.8 | Longview | Visit Longview Event Calendar | https://www.visitlongviewtexas.com/173/Calendar | `tourism_cvb, events_calendar, submit_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 12.7 | Overton | City of Overton | https://cityofoverton.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 12.7 | Overton | Overton ISD | https://www.overtonisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 13.3 | Lakeport | City of Lakeport | https://lakeporttx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 13.5 | Big Sandy | Big Sandy ISD | https://www.bigsandyisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 13.5 | Big Sandy | City of Big Sandy | https://bigsandytx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 13.7 | Winona | City of Winona | https://winonatexas.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 13.7 | Winona | Winona ISD | https://www.winonaisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 13.9 | New London | City of New London | https://www.etcog.org/new-london | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 13.9 | New London | Leverett's Chapel ISD | https://www.leverettschapelisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 13.9 | New London | West Rusk ISD | https://www.westruskisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |

### 16-30 miles

| Miles | Place / base | Name | URL | Tags | Notes |
|---:|---|---|---|---|---|
| 17.2 | New Chapel Hill | City of New Chapel Hill | https://www.etcog.org/new-chapel-hill | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 17.4 | Arp | Arp ISD | https://home.arpisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 17.4 | Arp | City of Arp | https://arptx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 18.2 | Hawkins | City of Hawkins | https://hawkinstx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 18.2 | Hawkins | Hawkins ISD | https://www.hawkinsisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 18.9 | Gilmer | City of Gilmer | https://gilmer-tx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 18.9 | Gilmer | East Texas Yamboree | https://yamboree.com/ | `festival, annual_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 18.9 | Gilmer | Gilmer ISD | https://www.gilmerisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 18.9 | Gilmer | Harmony ISD | https://www.harmonyisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 18.9 | Gilmer | The Gilmer Mirror | https://gilmermirror.com/ | `newspaper, local_news, event_notices` | Upshur County local paper. |
| 18.9 | Gilmer | Upshur County | https://www.countyofupshur.com/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 20.2 | New Diana | New Diana ISD | https://www.ndisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 21.3 | Hallsville | City of Hallsville | https://cityofhallsvilletx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 21.3 | Hallsville | Hallsville ISD | https://www.hisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 21.5 | Easton | City of Easton | https://cityofeastontx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 22.3 | Henderson | City of Henderson | https://hendersontx.us/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 22.3 | Henderson | Depot Museum | https://depotmuseum.com/ | `museum, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.3 | Henderson | Henderson Area Chamber Events | https://business.hendersontx.com/events | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.3 | Henderson | Henderson Civic Theatre | https://www.hendersoncivictheatre.org/ | `performing_arts, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.3 | Henderson | Henderson ISD | https://www.hendersonisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 22.3 | Henderson | Rusk County | https://www.co.rusk.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 22.3 | Henderson | The Henderson News | https://thehendersonnews.com/ | `newspaper, local_news, event_notices` | Rusk County local paper. |
| 22.5 | Tyler | Bandsintown - Tyler | https://www.bandsintown.com/c/tyler-tx | `event_aggregator, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | CBS19 | https://www.cbs19.tv/ | `tv_news, regional_news, events` | Regional TV news and community coverage. |
| 22.5 | Tyler | Caldwell Zoo | https://caldwellzoo.org/ | `zoo, family_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Chapel Hill ISD - Tyler | https://www.chapelhillisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 22.5 | Tyler | City of Tyler | https://www.cityoftyler.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 22.5 | Tyler | City of Tyler Calendar | https://www.cityoftyler.org/about-us/calendar-of-events | `city_official, municipal_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Cumberland Academy | https://www.cumberlandacademy.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 22.5 | Tyler | EGuide Calendar | https://eguidemagazine.com/calendar/ | `event_aggregator, regional_events, calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | EGuide Gig Guide | https://eguidemagazine.com/gig-guide-2/ | `event_aggregator, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | ETX Brewing Co. Events | https://etxbrew.com/events/ | `brewery, live_music, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | East Texas State Fair | https://www.etstatefair.com/ | `festival, fair, annual_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | East Texas Symphony Orchestra | https://etso.org/ | `performing_arts, symphony, concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Eventbrite - Tyler Events | https://www.eventbrite.com/d/tx--tyler/events/ | `event_aggregator, ticketing` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | KETK / FOX51 | https://www.ketk.com/ | `tv_news, regional_news, events` | Regional TV news and community coverage. |
| 22.5 | Tyler | KLTV | https://www.kltv.com/ | `tv_news, regional_news, events` | East Texas TV news; scrape community/event features. |
| 22.5 | Tyler | Liberty Hall | https://libertytyler.com/ | `performing_arts, music_venue, theater, film` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Liberty Hall Facebook | https://www.facebook.com/LibertyHallTyler/ | `venue_facebook, performing_arts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Smith County | https://www.smith-county.com/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 22.5 | Tyler | Texas Parks & Wildlife State Park Events Search | https://tpwd.texas.gov/state-parks/parks/things-to-do/calendar | `state_park, event_aggregator, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Texas Rose Festival | https://www.texasrosefestival.org/ | `festival, annual_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | The East Texas Weekend | https://www.theeasttexasweekend.com/ | `event_aggregator, live_music, regional_events` | High-value regional events and live-music source. |
| 22.5 | Tyler | The East Texas Weekend - Music | https://www.theeasttexasweekend.com/music/ | `event_aggregator, live_music` | Regional live music lineup/category. |
| 22.5 | Tyler | True Vine Brewing Events | https://www.truevinebrewing.com/fun | `brewery, live_music, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler Area Chamber Events | https://business.tylertexas.com/events/calendar | `chamber, business_events, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler Civic Theatre | https://tylercivictheatre.com/ | `performing_arts, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler ISD | https://www.tylerisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 22.5 | Tyler | Tyler Junior College | https://www.tjc.edu/ | `college, campus_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler Morning Telegraph / TylerPaper | https://tylerpaper.com/ | `newspaper, local_news, event_notices` | Major Tyler paper; event coverage and listings. |
| 22.5 | Tyler | Tyler Museum of Art | https://tylermuseum.org/ | `museum, arts, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler Parks Event Calendar | https://www.cityoftyler.org/government/departments/parks-rec/programs-services/programs-special-events/parks-event-calendar | `city_official, parks_rec, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Tyler State Park | https://tpwd.texas.gov/state-parks/tyler | `state_park, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | UT Tyler Cowan Center | https://cowancenter.org/ | `performing_arts, concert_venue, college` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | UT Tyler University Academy | https://www.uttia.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 22.5 | Tyler | University of Texas at Tyler Events | https://www.uttyler.edu/events/ | `college, campus_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Visit Tyler Annual Events | https://www.visittyler.com/p/annual-events | `tourism_cvb, annual_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 22.5 | Tyler | Visit Tyler Events | https://www.visittyler.com/p/events | `tourism_cvb, events_calendar, submit_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 23.1 | Whitehouse | City of Whitehouse | https://www.whitehousetx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 23.1 | Whitehouse | Whitehouse ISD | https://www.whitehouseisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 24.0 | Troup | City of Troup | https://trouptx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 24.0 | Troup | Troup ISD | https://www.troupisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 25.9 | Harleton | Harleton ISD | https://www.harletonisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 26.3 | Tatum | City of Tatum | https://tatum.texas.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 26.3 | Tatum | Martin Creek Lake State Park | https://tpwd.texas.gov/state-parks/martin-creek-lake | `state_park, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 26.3 | Tatum | Tatum ISD | https://www.tatumisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 26.7 | Carlisle | Carlisle ISD | https://www.carlisleisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 26.9 | Ore City | City of Ore City | https://orecitytx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 26.9 | Ore City | Ore City ISD | https://www.ocisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 27.9 | Lindale | City of Lindale | https://www.lindaletx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 27.9 | Lindale | Lindale ISD | https://www.lindaleeagles.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 27.9 | Lindale | Texas Music City Grill - Lindale Events | https://texasmusiccity.net/txm-lindale-events/ | `music_venue, restaurant, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 27.9 | Lindale | Texas Music City Grill - Lindale Facebook | https://www.facebook.com/txmlindale/ | `venue_facebook, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 27.9 | Lindale | The Cannery Lindale Facebook | https://www.facebook.com/thecannerylindale/ | `venue_facebook, shopping_district, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 27.9 | Lindale | Visit Lindale | https://visitlindale.com/ | `tourism_cvb, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |

### 31-45 miles

| Miles | Place / base | Name | URL | Tags | Notes |
|---:|---|---|---|---|---|
| 30.5 | Hideaway | City of Hideaway | https://cityofhideaway.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 30.6 | Noonday | City of Noonday | https://cityofnoonday.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 31.3 | Bullard | Bullard ISD | https://www.bullardisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 31.3 | Bullard | City of Bullard | https://bullardtexas.net/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 31.6 | Beckville | Beckville ISD | https://www.beckvilleisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 31.6 | Beckville | City of Beckville | https://www.etcog.org/beckville | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 33.3 | Chandler | City of Chandler | https://www.chandlertx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 33.7 | Marshall | City of Marshall | https://www.marshalltexas.net/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 33.7 | Marshall | Elysian Fields ISD | https://www.efisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 33.7 | Marshall | Eventbrite - Marshall Events | https://www.eventbrite.com/d/tx--marshall/events/ | `event_aggregator, ticketing` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Harrison County | https://www.harrisoncountytexas.gov/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 33.7 | Marshall | Marshall Chamber Events | https://marshalltexas.com/events/ | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Marshall ISD | https://www.marshallisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 33.7 | Marshall | Marshall News Messenger | https://www.marshallnewsmessenger.com/ | `newspaper, local_news, event_notices` | Harrison County local paper. |
| 33.7 | Marshall | Marshall Symphony | https://marshallsymphony.com/ | `performing_arts, symphony, concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Memorial City Hall Performance Center | https://www.memorialcityhall.com/ | `performing_arts, concert_venue, civic_venue` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Visit Marshall | https://visitmarshalltexas.com/ | `tourism_cvb, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Visit Marshall Annual Events | https://visitmarshalltexas.com/annual-events/ | `tourism_cvb, annual_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 33.7 | Marshall | Wonderland of Lights | https://www.marshalltexas.net/483/Wonderland-of-Lights | `festival, annual_event, city_official` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 34.1 | New Summerfield | City of New Summerfield | https://newsummerfield.us/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 34.1 | New Summerfield | New Summerfield ISD | https://www.newsummerfieldisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 34.3 | Laneville | Laneville ISD | https://www.lanevilleisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 35.3 | Mineola | City of Mineola | https://www.mineola.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 35.3 | Mineola | Mineola Chamber | https://mineolachamber.org/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 35.3 | Mineola | Mineola Civic Center | https://www.mineolaciviccenter.com/ | `civic_venue, event_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 35.3 | Mineola | Mineola ISD | https://www.mineolaisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 36.3 | Lone Star | City of Lone Star | https://www.lonestartx.net/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 37.3 | Caney City | City of Caney City | https://www.etcog.org/caney-city | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 37.4 | Pittsburg | City of Pittsburg | https://www.pittsburgtexas.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 37.4 | Pittsburg | Pittsburg ISD | https://www.pittsburgisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 37.4 | Pittsburg | Pittsburg-Camp County Chamber | https://www.pittsburgchamber.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 37.4 | Pittsburg | Steel Country Bee / Pittsburg Gazette | https://www.steelcountrybee.com/ | `newspaper, local_news, event_notices` | Pittsburg/Camp County local publication. |
| 37.4 | Pittsburg | Un Sueño Vineyards | https://unsuenovineyard.com/ | `winery, live_music, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 37.8 | Avinger | Avinger ISD | https://www.avingerisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 37.8 | Avinger | Town of Avinger | https://www.facebook.com/p/City-of-Avinger-100071983763184/ | `city_facebook, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 38.1 | Quitman | City of Quitman | https://quitmantx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 38.1 | Quitman | Quitman ISD | https://www.quitmanisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 38.1 | Quitman | Wood County | https://www.mywoodcounty.com/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 38.1 | Quitman | Wood County Monitor | https://woodcountymonitor.com/ | `newspaper, local_news, event_notices` | Wood County publication. |
| 39.2 | Jacksonville | Cherokee Civic Theatre | https://www.cherokeetheatre.net/ | `performing_arts, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 39.2 | Jacksonville | City of Jacksonville | https://www.jacksonville-texas.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 39.2 | Jacksonville | Jacksonville Chamber | https://www.jacksonvilletexas.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 39.2 | Jacksonville | Jacksonville ISD | https://www.jisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 39.2 | Jacksonville | Jacksonville Progress | https://www.jacksonvilleprogress.com/ | `newspaper, local_news, event_notices` | Cherokee County/Jacksonville paper. |
| 39.7 | Coffee City | City of Coffee City | https://cityofcoffeecity.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 39.7 | Edom | City of Edom | https://edomtexas.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 39.7 | Edom | Moore's Store - Ben Wheeler info | https://www.benwheelertx.com/moores-store/ | `music_venue_directory, restaurant, live_music` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 39.7 | Edom | Moore's Store Texas Facebook | https://www.facebook.com/p/Moores-Store-Texas-100084156972138/ | `venue_facebook, live_music` | Ben Wheeler-area venue; FB-first event source. |
| 39.7 | Edom | The Forge Ben Wheeler Events | https://theforgebenwheeler.com/category/events-in-ben-wheeler/ | `restaurant, event_venue, live_music` | Ben Wheeler is near Edom/Van; use Edom/Van distance band if geocoding separately. |
| 39.7 | Edom | Visit Edom | https://visitedom.com/ | `tourism, arts, festival` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 39.9 | Mount Enterprise | City of Mount Enterprise | https://cityofmte.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 39.9 | Mount Enterprise | Mount Enterprise ISD | https://www.meisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.2 | Gallatin | City of Gallatin | https://www.etcog.org/gallatin | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.2 | Jefferson | City of Jefferson | https://www.jeffersontexas.us/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.2 | Jefferson | Diamond Don's RV Park & Event Center | https://diamonddons.com/ | `event_venue, festival, motorsports` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.2 | Jefferson | Jefferson ISD | https://jeffersonisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.2 | Jefferson | Jefferson Opera House Theatre Players Facebook | https://www.facebook.com/jeffersonohtp/ | `venue_facebook, performing_arts, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.2 | Jefferson | Marion County Herald & Jefferson Jimplecute | https://marioncoherald.com/ | `newspaper, local_news, calendar` | Local paper with community calendar. |
| 40.2 | Jefferson | Marion County Herald Calendar | https://marioncoherald.com/calendar-of-events/ | `newspaper_calendar, community_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.2 | Jefferson | Visit Jefferson Events Calendar | https://visitjeffersontexas.com/events-calendar | `tourism_cvb, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.4 | Rocky Mound | Town of Rocky Mound | https://www.etcog.org/rocky-mound | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.4 | Winnsboro | City of Winnsboro | https://cityofwinnsboro.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.4 | Winnsboro | Winnsboro Center for the Arts | https://winnsborocenterforthearts.com/ | `arts_center, live_music, gallery_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.4 | Winnsboro | Winnsboro Chamber | https://www.winnsboro.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.4 | Winnsboro | Winnsboro ISD | https://www.winnsboroisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.5 | Carthage | Carthage ISD | https://www.carthageisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.5 | Carthage | City of Carthage | https://www.carthagetexas.us/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.5 | Carthage | Panola Charter School | https://www.panolacharterschool.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.5 | Carthage | Panola College Events | https://www.panola.edu/events/ | `college, campus_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.5 | Carthage | Panola County | https://www.co.panola.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 40.5 | Carthage | Panola County Chamber Events | https://www.panolacountychamber.com/events | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.5 | Carthage | Panola Watchman | https://www.panolawatchman.com/ | `newspaper, local_news, event_notices` | Panola County paper. |
| 40.5 | Carthage | Texas Country Music Hall of Fame | https://tcmhof.com/ | `museum, music, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 40.6 | Berryville | City of Berryville | https://cityofberryville.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.6 | Reklaw | City of Reklaw | https://cityofreklaw.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.7 | Cuney | City of Cuney | https://www.etcog.org/cuney | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 40.9 | Brownsboro | Brownsboro ISD | https://www.gobearsgo.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 40.9 | Brownsboro | City of Brownsboro | https://brownsboro.municipalimpact.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.0 | Moore Station | City of Moore Station | https://www.etcog.org/moore-station | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.0 | Scottsville | City of Scottsville | https://www.etcog.org/scottsville | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.2 | Van | City of Van | https://vantx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.2 | Van | Van ISD | https://www.vanschools.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 41.5 | Hughes Springs | City of Hughes Springs | https://www.hughesspringstxusa.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.5 | Hughes Springs | Hughes Springs ISD | https://www.hsisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 41.7 | Daingerfield | City of Daingerfield | https://cityofdaingerfield.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 41.7 | Daingerfield | Daingerfield State Park | https://tpwd.texas.gov/state-parks/daingerfield | `state_park, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 41.7 | Daingerfield | Daingerfield-Lone Star ISD | https://www.dlsisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 41.7 | Daingerfield | Morris County | https://www.co.morris.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 43.5 | Frankston | City of Frankston | https://frankstontx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 43.5 | Frankston | Frankston ISD | https://www.frankstonisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 43.7 | Log Cabin | City of Log Cabin | https://cityoflogcabin.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 44.4 | Gary | City of Gary | https://www.etcog.org/gary | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 44.4 | Gary | Gary ISD | https://garyisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 44.7 | Cushing | City of Cushing | https://cushingtx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 44.7 | Cushing | Cushing ISD | https://www.cushingisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |

### 46-60 miles

| Miles | Place / base | Name | URL | Tags | Notes |
|---:|---|---|---|---|---|
| 46.9 | Alba | Alba-Golden ISD | https://www.agisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 46.9 | Alba | City of Alba | https://albatexas.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 47.2 | Rusk | Cherokee County | https://www.co.cherokee.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 47.2 | Rusk | Cherokeean Herald | https://www.thecherokeean.com/ | `newspaper, local_news, event_notices` | Rusk/Cherokee County local paper. |
| 47.2 | Rusk | City of Rusk | https://www.rusktx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 47.2 | Rusk | Rusk Chamber of Commerce | https://www.ruskchamber.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 47.2 | Rusk | Rusk ISD | https://www.ruskisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 47.2 | Rusk | Texas State Railroad | https://texasstaterailroad.net/ | `tourism, rail_events, family_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 47.5 | Grand Saline | City of Grand Saline | https://www.grandsaline.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 47.5 | Grand Saline | Grand Saline ISD | https://www.grandsalineisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 47.5 | Grand Saline | Grand Saline Salt Festival | https://grandsalinesaltfestival.com/ | `festival, annual_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 47.5 | Grand Saline | Grand Saline Sun | https://grandsalinesun.com/ | `newspaper, local_news, event_notices` | Grand Saline local publication. |
| 48.5 | Mount Pleasant | Chapel Hill ISD - Mount Pleasant | https://www.chisddevils.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 48.5 | Mount Pleasant | City of Mount Pleasant | https://mpcity.net/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 48.5 | Mount Pleasant | Harts Bluff ISD | https://www.hbisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 48.5 | Mount Pleasant | Lake Bob Sandlin State Park | https://tpwd.texas.gov/state-parks/lake-bob-sandlin | `state_park, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 48.5 | Mount Pleasant | Mount Pleasant ISD | https://www.mpisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 48.5 | Mount Pleasant | Mount Pleasant Tribune / TribNow | https://www.tribnow.com/ | `newspaper, local_news, event_notices` | Titus County local paper. |
| 48.5 | Mount Pleasant | Mount Pleasant-Titus County Chamber | https://www.mtpleasanttx.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 48.5 | Mount Pleasant | Titus County | https://www.co.titus.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 48.5 | Mount Pleasant | Visit Mount Pleasant | https://www.visitmountpleasanttx.com/ | `tourism_cvb, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 49.2 | Murchison | City of Murchison | https://murchisontx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 49.2 | Murchison | Murchison ISD | https://www.murchisonisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 49.5 | Timpson | City of Timpson | https://www.cityoftimpson.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 49.5 | Timpson | Shelby County | https://www.co.shelby.tx.us/ | `county_government, public_notices` | County seat is outside 60 miles, but Timpson/Tenaha area falls in radius. |
| 49.5 | Timpson | Timpson ISD | https://www.timpsonisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 49.5 | Yantis | City of Yantis | https://cityofyantis.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 49.5 | Yantis | Yantis ISD | https://www.yantisisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 50.6 | Uncertain | Caddo Lake State Park | https://tpwd.texas.gov/state-parks/caddo-lake | `state_park, outdoor_events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 50.6 | Uncertain | City of Uncertain | https://cityofuncertain.com/ | `city_official, municipal_calendar, tourism` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 50.6 | Uncertain | Karnack ISD | https://www.karnackisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 50.7 | Garrison | City of Garrison | https://garrisontx.us/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 50.7 | Garrison | Garrison ISD | https://www.garrisonisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 50.8 | Linden | Cass County | https://www.co.cass.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 50.8 | Linden | Cass County Citizens Journal-Sun | https://www.casscountynow.com/ | `newspaper, local_news, event_notices` | Cass County local paper. |
| 50.8 | Linden | City of Linden | https://www.lindentx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 50.8 | Linden | Linden-Kildare CISD | https://www.lkcisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 50.8 | Linden | Music City Texas Facebook | https://www.facebook.com/musiccitytexas/ | `venue_facebook, concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 50.8 | Linden | Music City Texas Shows | https://www.musiccitytexas.org/shows | `music_venue, concerts, event_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 50.8 | Linden | Music City Texas Theater | https://www.musiccitytexas.org/ | `music_venue, theater, concerts` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 51.1 | Waskom | City of Waskom | https://cityofwaskom.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 51.1 | Waskom | Waskom ISD | https://www.waskomisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 51.3 | Omaha | City of Omaha | https://cityofomahatx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 51.3 | Omaha | Pewitt CISD | https://www.pewittcisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 52.0 | Central Heights | Central Heights ISD | https://www.centralhts.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 52.1 | Como | City of Como | https://cityofcomo.myruralwater.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 52.1 | Como | Como-Pickton CISD | https://www.cpcisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 53.0 | Fruitvale | City of Fruitvale | https://cityoffruitvaletx.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 53.0 | Fruitvale | Fruitvale ISD | https://www.fruitvaleisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 53.3 | Mount Vernon | City of Mount Vernon | https://www.cityofmountvernontexas.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 53.3 | Mount Vernon | Franklin County | https://www.co.franklin.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 53.3 | Mount Vernon | Franklin County Chamber | https://franklincountychamber.org/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 53.3 | Mount Vernon | Mount Vernon ISD | https://www.mtvernonisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 53.3 | Mount Vernon | Mount Vernon Optic-Herald archive | https://texashistory.unt.edu/explore/collections/MVOH/ | `newspaper_archive, ceased_publication` | Publication has ceased; keep only as an archive/legacy reference, not a live event source. |
| 53.7 | Tenaha | City of Tenaha | https://www.facebook.com/CityOfTenaha/ | `city_facebook, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 53.7 | Tenaha | Tenaha ISD | https://www.tenahaisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 53.8 | Naples | City of Naples | https://cityofnaplestx.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 54.2 | Appleby | City of Appleby | https://thecityofappleby.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 54.2 | Appleby | Nacogdoches County | https://www.co.nacogdoches.tx.us/ | `county_government, public_notices` | County seat is just outside 60 miles, but Appleby/Central Heights/Douglass area falls in radius. |
| 54.5 | Canton | Canton Herald | https://www.thecantonherald.com/ | `newspaper, local_news, event_notices` | Van Zandt County/Canton publication. |
| 54.5 | Canton | Canton ISD | https://www.cantonisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 54.5 | Canton | City of Canton | https://www.cantontx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 54.5 | Canton | First Monday Trade Days - Canton | https://www.firstmondaycanton.com/ | `market, festival, recurring_event` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 54.5 | Canton | Van Zandt County | https://www.vanzandtcounty.org/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 54.5 | Canton | Visit Canton | https://www.visitcantontx.com/ | `tourism_cvb, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 54.5 | Douglass | Douglass ISD | https://www.douglassisd.com | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 54.6 | Poynor | City of Poynor | https://www.etcog.org/poyner | `city_directory_no_site, municipal` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 54.6 | Poynor | LaPoynor ISD | https://www.lapoynorisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 55.2 | Saltillo | Hopkins County | https://www.hopkinscountytx.org/ | `county_government, public_notices` | County seat is just outside 60 miles, but western/southern communities such as Como/Saltillo fall in radius. |
| 55.2 | Saltillo | Saltillo ISD | https://www.saltilloisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 56.2 | Alto | Alto ISD | https://www.alto.esc7.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 56.2 | Alto | City of Alto | https://www.altotexas.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 56.3 | Emory | City of Emory | https://cityofemory.com/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 56.3 | Emory | Rains County | https://www.co.rains.tx.us/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 56.3 | Emory | Rains County Chamber | https://www.rainscountychamber.com/ | `chamber, events` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 56.3 | Emory | Rains County Leader | https://my.rainscountyleader.com/ | `newspaper, local_news, event_notices` | Rains County publication. |
| 56.3 | Emory | Rains ISD | https://www.rainsisd.org | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 56.4 | Athens | Athens Chamber Events | https://www.athenstxchamber.org/events | `chamber, events_calendar` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 56.4 | Athens | Athens Daily Review | https://www.athensreview.com/ | `newspaper, local_news, event_notices` | Henderson County paper; just within 60-mi radius. |
| 56.4 | Athens | Athens ISD | https://www.athensisd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |
| 56.4 | Athens | City of Athens | https://www.athenstx.gov/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 56.4 | Athens | Henderson County | https://www.henderson-county.com/ | `county_government, public_notices` | County calendars/public notices can surface fairs, courthouse events, emergency/community announcements, and recurring public meetings. |
| 56.4 | Athens | Henderson County Performing Arts Center | https://www.hcpac.org/ | `performing_arts, theater` | High-value source for scrapeable event pages, calendars, venue schedules, ticketing, or public event notices. |
| 57.7 | Edgewood | City of Edgewood | https://edgewoodtexas.org/ | `city_official, municipal_calendar` | Official city site when available; ETCOG/TML directory used where no standalone site was found. |
| 57.7 | Edgewood | Edgewood ISD | https://www.edgewood-isd.net | `school_district, district_calendar, athletics, fine_arts` | Scrape district calendar, athletics calendar, fine arts/band pages, board/community announcements. |

## Near-radius expansion candidates

These are just outside the strict 60-mile center-to-city calculation or have county areas inside the radius. They are worth considering if you broaden the calendar to practical East Texas drive markets.

| Miles | Place / base | Name | URL | Tags |
|---:|---|---|---|---|
| 61.0 | Sulphur Springs | Sulphur Springs News-Telegram | https://www.ssnewstelegram.com/ | `newspaper, near_radius` |
| 61.0 | Sulphur Springs | Visit Sulphur Springs | https://visitsulphurspringstx.org/ | `tourism_cvb, near_radius` |
| 61.1 | Nacogdoches | City of Nacogdoches | https://www.nactx.us/ | `city_official, near_radius` |
| 61.1 | Nacogdoches | The Daily Sentinel | https://www.dailysentinel.com/ | `newspaper, near_radius` |
| 61.1 | Nacogdoches | Visit Nacogdoches | https://www.visitnacogdoches.org/ | `tourism_cvb, near_radius` |
| 62.8 | Palestine | Palestine Herald-Press | https://www.palestineherald.com/ | `newspaper, near_radius` |
| 62.8 | Palestine | Visit Palestine | https://visitpalestine.com/ | `tourism_cvb, near_radius` |
| 63.5 | Center | Shelby County Today | https://scttx.com/ | `online_news, near_radius` |

## Scraping notes

1. **Normalize event fields** across sources: title, start/end time, timezone, venue, city, source URL, ticket URL, categories, image URL, organizer, and last-seen timestamp.
2. **Detect recurring events** from city/chamber calendars and First Monday/festival pages before de-duplicating by title alone.
3. **School event pages** often separate district calendars from athletics, fine arts, band, theater, and campus calendars. Ingestion should look for embedded Google Calendar, RankOne, Arbiter/athletics, and CMS calendar feeds.
4. **Newspapers** are useful for community-event announcements, but venue/CVB pages are usually better for event times and ticket links.
5. **Facebook-only sources** should be handled as a separate ingestion class because public availability and page structures change often.
6. **County and city public notices** are lower-yield for entertainment events but useful for civic meetings, county fairs, public hearings, emergency/community alerts, and recurring civic calendars.