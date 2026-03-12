import type { DailyOutfit } from '../types';

/**
 * Generates an ICS calendar event for an outfit
 */
function generateIcsEvent(outfit: DailyOutfit, date: string): string {
    const eventDate = new Date(date);
    const start = new Date(eventDate.setHours(7, 0, 0)); // 7:00 AM
    const end = new Date(eventDate.setHours(23, 0, 0)); // 11:00 PM
    
    const itemsList = outfit.items.map(item => `• ${item.name} (${item.category})`).join('\\n');
    const description = `Outfit planificado:\\n${itemsList}${outfit.event ? `\\n\\nOcasión: ${outfit.event}` : ''}${outfit.notes ? `\\n\\nNotas: ${outfit.notes}` : ''}`;
    
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Qué Me Pongo//Outfit Planner//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:outfit-${outfit.date || date}-${Date.now()}@quemepongo.app`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${escapeIcs(outfit.event || 'Outfit del día - Qué Me Pongo')}`,
        `DESCRIPTION:${description}`,
        'LOCATION:',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\\r\\n');
    
    return ics;
}

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSS)
 */
function formatIcsDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Escapes special characters for ICS format
 */
function escapeIcs(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\\n/g, '\\n');
}

/**
 * Downloads an ICS file for a single day's outfit
 */
export function downloadSingleOutfit(outfit: DailyOutfit): void {
    const date = outfit.date || new Date().toISOString().split('T')[0];
    const icsContent = generateIcsEvent(outfit, date);
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `outfit-${date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Downloads an ICS file for a week's worth of outfits
 */
export function downloadWeeklyOutfits(outfits: DailyOutfit[]): void {
    const events = outfits
        .filter(outfit => outfit.items.length > 0) // Only include days with outfits
        .map(outfit => {
            const date = outfit.date || new Date().toISOString().split('T')[0];
            return generateIcsEvent(outfit, date);
        })
        .join('\\r\\n');
    
    if (!events) {
        alert('No hay outfits para exportar. Planifica al menos un día.');
        return;
    }
    
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Qué Me Pongo//Outfit Planner//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        events.replace(/BEGIN:VCALENDAR[\\r\\n]+VERSION:2\\.0[\\r\\n]+PRODID:[^\\r\\n]+[\\r\\n]+CALSCALE:GREGORIAN[\\r\\n]+METHOD:PUBLISH[\\r\\n]+/g, ''),
        'END:VCALENDAR'
    ].join('\\r\\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'outfits-semanales.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Opens Google Calendar with pre-filled event details
 */
export function openGoogleCalendar(outfit: DailyOutfit): void {
    const date = outfit.date || new Date().toISOString().split('T')[0];
    const eventDate = new Date(date);
    const start = new Date(eventDate.setHours(7, 0, 0));
    const end = new Date(eventDate.setHours(23, 0, 0));
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const itemsList = outfit.items.map(item => `• ${item.name} (${item.category})`).join('%0A');
    const description = `Outfit planificado:%0A${itemsList}${outfit.event ? `%0A%0AOcasión: ${outfit.event}` : ''}${outfit.notes ? `%0A%0ANotas: ${outfit.notes}` : ''}`;
    
    const title = encodeURIComponent(outfit.event || 'Outfit del día - Qué Me Pongo');
    const dates = `${formatDate(start)}/${formatDate(end)}`;
    const details = encodeURIComponent(description);
    const location = encodeURIComponent('');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    
    window.open(url, '_blank');
}

/**
 * Opens Outlook Calendar with pre-filled event details
 */
export function openOutlookCalendar(outfit: DailyOutfit): void {
    const date = outfit.date || new Date().toISOString().split('T')[0];
    const eventDate = new Date(date);
    const start = new Date(eventDate.setHours(7, 0, 0));
    const end = new Date(eventDate.setHours(23, 0, 0));
    
    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const itemsList = outfit.items.map(item => `• ${item.name} (${item.category})`).join('%0D%0A');
    const description = `Outfit planificado:%0D%0A${itemsList}${outfit.event ? `%0D%0A%0DOcasión: ${outfit.event}` : ''}${outfit.notes ? `%0D%0A%0ANotas: ${outfit.notes}` : ''}`;
    
    const title = encodeURIComponent(outfit.event || 'Outfit del día - Qué Me Pongo');
    const startdate = formatDate(start);
    const enddate = formatDate(end);
    const details = encodeURIComponent(description);
    
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startdate}&enddt=${enddate}&subject=${title}&body=${details}`;
    
    window.open(url, '_blank');
}

/**
 * Opens Apple Calendar (iOS/macOS) with pre-filled event details
 */
export function openAppleCalendar(outfit: DailyOutfit): void {
    // For iOS, we use the x-web-calendar:// scheme or fallback to ICS download
    const date = outfit.date || new Date().toISOString().split('T')[0];
    const eventDate = new Date(date);
    const start = new Date(eventDate.setHours(7, 0, 0));
    
    const formatDate = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    
    const itemsList = outfit.items.map(item => `• ${item.name} (${item.category})`).join('%0A');
    const description = `Outfit planificado:%0A${itemsList}${outfit.event ? `%0A%0AOcasión: ${outfit.event}` : ''}`;
    
    const title = encodeURIComponent(outfit.event || 'Outfit del día');
    const startdate = formatDate(start);
    const details = encodeURIComponent(description);
    
    // Try x-web-calendar first (iOS), fallback to ICS
    const url = `x-web-calendar://?action=NEW&dtstart=${startdate}&summary=${title}&description=${details}`;
    
    // Create hidden iframe to try the URL scheme
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    // Fallback to ICS download after 1 second
    setTimeout(() => {
        document.body.removeChild(iframe);
        downloadSingleOutfit(outfit);
    }, 1000);
}
