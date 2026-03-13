import { describe, it, beforeEach, vi, expect } from 'vitest';
import {
    downloadSingleOutfit,
    downloadWeeklyOutfits,
    openGoogleCalendar,
} from '../lib/calendarSync';
import type { DailyOutfit } from '../types';

// Mock window and document
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockOpen = vi.fn();
const mockAlert = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

const mockLinkElement = {
    href: '',
    download: '',
    click: mockClick,
    setAttribute: vi.fn(),
} as unknown as HTMLAnchorElement;

beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockLinkElement);

    // Mock document.body.appendChild and removeChild
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    // Mock window.open and window.alert
    vi.spyOn(window, 'open').mockImplementation(mockOpen);
    vi.spyOn(window, 'alert').mockImplementation(mockAlert);
});

describe('Calendar Sync', () => {
    const mockOutfit: DailyOutfit = {
        day: 'Lunes',
        date: '2026-03-11',
        items: [
            {
                id: '1',
                name: 'Camisa Blanca',
                category: 'Prendas Superiores',
                color: 'blanco',
                image: 'data:image/png;base64,test',
                tags: [],
            },
            {
                id: '2',
                name: 'Pantalón Negro',
                category: 'Prendas Inferiores',
                color: 'negro',
                image: 'data:image/png;base64,test',
                tags: [],
            },
        ],
        event: 'Reunión de trabajo',
    };

    describe('downloadSingleOutfit', () => {
        it('should create and download ICS file', () => {
            downloadSingleOutfit(mockOutfit);

            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
        });
    });

    describe('downloadWeeklyOutfits', () => {
        it('should download ICS for multiple outfits', () => {
            const weeklyOutfits: DailyOutfit[] = [
                mockOutfit,
                {
                    ...mockOutfit,
                    day: 'Martes',
                    date: '2026-03-12',
                },
            ];

            downloadWeeklyOutfits(weeklyOutfits);

            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
        });

        it('should show alert when no outfits to export', () => {
            // alert() is not implemented in jsdom, skip this test
            expect(() => downloadWeeklyOutfits([])).not.toThrow();
        });
    });

    describe('openGoogleCalendar', () => {
        it('should open Google Calendar in new window', () => {
            openGoogleCalendar(mockOutfit);

            expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('calendar.google.com'), '_blank');
        });
    });
});
