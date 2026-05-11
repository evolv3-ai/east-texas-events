erDiagram

    CalendarAddress {
    string address1
    string address2
    string city
    string region
    string region_code
    string postal_code
    string country
    string country_code
    }

    CalendarAttachment {
    id id
    string name
    string mime_type
    string download_url
    }

    CalendarAttendee {
    id user_id
    string email
    string name
    CalendarAttendeeStatus status
    boolean required
    boolean is_cohost
    }

    CalendarBusy {
    id id
    date start_at
    date end_at
    string timezone
    string description
    object raw
    }

    CalendarCalendar {
    id id
    date created_at
    date updated_at
    string name
    string description
    string timezone
    boolean is_primary
    object raw
    }

    CalendarConference {
    string conference_identifier
    string url
    string label
    string telephone
    string participant_access_code
    string host_access_code
    string notes
    string country_code
    string region_code
    }

    CalendarDevice {
    id id
    string name
    id room_id
    object raw
    }

    CalendarEvent {
    id id
    string created_at
    string updated_at
    id calendar_id
    string subject
    string start_at
    string end_at
    boolean is_all_day
    string timezone
    string notes
    string location
    boolean is_free
    boolean is_private
    CalendarEventStatus status
    CalendarAttendee organizer
    CalendarAttendee[] attendees
    id recurring_event_id
    CalendarEventRecurrence[] recurrence
    string web_url
    boolean has_conference
    CalendarConference[] conference
    CalendarAttachment[] attachments
    boolean send_notifications
    object raw
    }

    CalendarEventRecurrence {
    CalendarRecurringFrequency frequency
    number interval
    number count
    date end_at
    CalendarRecurringDays[] on_days
    number[] on_months
    number[] on_month_days
    number[] on_weeks
    number[] on_year_days
    CalendarRecurringDays week_start
    date[] excluded_dates
    date[] included_dates
    string timezone
    }

    CalendarLink {
    id id
    string created_at
    string updated_at
    string name
    string url
    number duration
    string description
    boolean is_active
    number price_amount
    string price_currency
    object raw
    }

    CalendarLocation {
    id id
    string name
    id parent_id
    CalendarLocationType type
    CalendarAddress address
    object raw
    }

    CalendarRecording {
    id id
    date created_at
    date updated_at
    date start_at
    date end_at
    date expires_at
    id event_id
    string web_url
    CalendarRecordingMedia[] media
    object raw
    }

    CalendarRecordingMedia {
    CalendarAttendee[] attendees
    date start_at
    date end_at
    string language
    CalendarRecordingTranscript[] transcripts
    string transcript_download_url
    string recording_download_url
    }

    CalendarRecordingTranscript {
    date start_at
    date end_at
    string text
    CalendarAttendee attendee
    string language
    }

    CalendarRoom {
    id id
    string name
    number capacity
    id location_id
    object raw
    }

    CalendarWebinar {
    id id
    date created_at
    date updated_at
    id calendar_id
    string subject
    date start_at
    date end_at
    string timezone
    string notes
    CalendarEventStatus status
    CalendarAttendee organizer
    string join_url
    string web_url
    CalendarWebinarPanelist[] panelists
    CalendarWebinarRegistrant[] registrants
    string panelist_password
    string registrant_password
    CalendarConference[] conference
    CalendarEventRecurrence[] recurrence
    number capacity
    boolean is_webcast
    boolean is_enabled
    boolean is_auto_approve
    boolean require_first_name
    boolean require_last_name
    boolean require_email
    boolean require_company
    boolean require_job_title
    boolean require_address
    boolean require_phone
    boolean has_qa
    boolean has_polls
    boolean has_recording
    object raw
    }

    CalendarWebinarPanelist {
    string email
    string name
    boolean is_required
    string join_url
    string join_password
    CalendarAttendeeStatus status
    }

    CalendarWebinarRegistrant {
    string email
    string name
    string registration_reference
    CalendarWebinarRegistrantStatus registration_status
    date registered_at
    }

    CalendarAttendeeStatus {
        string ACCEPTED
        string REJECTED
        string TENTATIVE
    }

    CalendarEventStatus {
        string CANCELED
        string CONFIRMED
        string TENTATIVE
    }

    CalendarLocationType {
        string BUILDING
        string FLOOR
        string CAMPUS
        string CITY
        string REGION
        string COUNTRY
        string OTHER
    }

    CalendarRecurringDays {
        string SU
        string MO
        string TU
        string WE
        string TH
        string FR
        string SA
    }

    CalendarRecurringFrequency {
        string DAILY
        string WEEKLY
        string MONTHLY
        string YEARLY
    }

    CalendarWebinarRegistrantStatus {
        string PENDING
        string APPROVED
        string REJECTED
        string CANCELLED
    }

    CalendarDevice ||--|| CalendarRoom : references
    CalendarEvent ||--|| CalendarCalendar : references
    CalendarEvent ||--|| CalendarAttendee : contains
    CalendarEvent ||--o{ CalendarAttendee : contains
    CalendarEvent ||--|| CalendarEvent : references
    CalendarEvent ||--o{ CalendarEventRecurrence : contains
    CalendarEvent ||--o{ CalendarConference : contains
    CalendarEvent ||--o{ CalendarAttachment : contains
    CalendarLocation ||--|| CalendarLocation : references
    CalendarLocation ||--|| CalendarAddress : contains
    CalendarRecording ||--|| CalendarEvent : references
    CalendarRecording ||--o{ CalendarRecordingMedia : contains
    CalendarRecordingMedia ||--o{ CalendarAttendee : contains
    CalendarRecordingMedia ||--o{ CalendarRecordingTranscript : contains
    CalendarRecordingTranscript ||--|| CalendarAttendee : contains
    CalendarRoom ||--|| CalendarLocation : references
    CalendarWebinar ||--|| CalendarCalendar : references
    CalendarWebinar ||--|| CalendarAttendee : contains
    CalendarWebinar ||--o{ CalendarWebinarPanelist : contains
    CalendarWebinar ||--o{ CalendarWebinarRegistrant : contains
    CalendarWebinar ||--o{ CalendarConference : contains
    CalendarWebinar ||--o{ CalendarEventRecurrence : contains