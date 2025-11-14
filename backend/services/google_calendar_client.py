"""
Google Calendar client
Handles low-level communication with the Google Calendar API.

This implementation uses a service account and a single calendar ID,
which is suitable for a personal assistant used by one primary user.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import json
import os

from google.oauth2 import service_account
from googleapiclient.discovery import build

from shared.schemas import CalendarEvent


class GoogleCalendarClient:
    """Wrapper around Google Calendar API (service account)."""

    def __init__(self):
        service_account_info = os.getenv("GOOGLE_SERVICE_ACCOUNT_INFO")
        service_account_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")

        scopes = ["https://www.googleapis.com/auth/calendar"]

        if service_account_info:
            info = json.loads(service_account_info)
            self.credentials = service_account.Credentials.from_service_account_info(
                info,
                scopes=scopes,
            )
        elif service_account_file:
            self.credentials = service_account.Credentials.from_service_account_file(
                service_account_file,
                scopes=scopes,
            )
        else:
            # Not configured; client will be effectively disabled
            self.credentials = None

        self.calendar_id = os.getenv("GOOGLE_CALENDAR_ID")

    def is_configured(self) -> bool:
        return self.credentials is not None and bool(self.calendar_id)

    def _build_service(self):
        return build("calendar", "v3", credentials=self.credentials, cache_discovery=False)

    def fetch_events(
        self,
        time_min: datetime,
        time_max: datetime,
        max_results: int = 50,
    ) -> List[CalendarEvent]:
        """Fetch events from Google Calendar within a time window."""

        if not self.is_configured():
            return []

        try:
            service = self._build_service()

            events_result = (
                service.events()
                .list(
                    calendarId=self.calendar_id,
                    timeMin=time_min.isoformat() + "Z",
                    timeMax=time_max.isoformat() + "Z",
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )

            items = events_result.get("items", [])
            results: List[CalendarEvent] = []

            for item in items:
                start_raw = item.get("start", {})
                end_raw = item.get("end", {})

                start_str: Optional[str] = start_raw.get("dateTime") or start_raw.get("date")
                end_str: Optional[str] = end_raw.get("dateTime") or end_raw.get("date")

                if not start_str or not end_str:
                    continue

                is_all_day = "date" in start_raw

                # Parse ISO strings to datetime; Google may return date-only for all day
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))

                event = CalendarEvent(
                    id=None,
                    user_id="",  # Will be set by caller
                    source="google",
                    external_id=item.get("id"),
                    start_time=start_dt,
                    end_time=end_dt,
                    title=item.get("summary") or "Untitled event",
                    description=item.get("description"),
                    location=item.get("location"),
                    is_all_day=is_all_day,
                )
                results.append(event)

            return results
        except Exception as exc:  # pragma: no cover - defensive catch for runtime issues
            # In case of network / credential issues, fail gracefully and log.
            print(f"[GoogleCalendarClient] Error fetching events: {exc}")
            return []

    def create_event(self, event: CalendarEvent) -> Optional[str]:
        """Create an event in Google Calendar mirroring the given CalendarEvent."""

        if not self.is_configured():
            return None

        try:
            service = self._build_service()

            if event.is_all_day:
                start_body = {"date": event.start_time.date().isoformat()}
                end_body = {"date": event.end_time.date().isoformat()}
            else:
                start_body = {"dateTime": event.start_time.isoformat(), "timeZone": "UTC"}
                end_body = {"dateTime": event.end_time.isoformat(), "timeZone": "UTC"}

            body = {
                "summary": event.title,
                "description": event.description,
                "location": event.location,
                "start": start_body,
                "end": end_body,
            }

            created = (
                service.events()
                .insert(calendarId=self.calendar_id, body=body)
                .execute()
            )
            return created.get("id")
        except Exception as exc:  # pragma: no cover
            print(f"[GoogleCalendarClient] Error creating event: {exc}")
            return None


