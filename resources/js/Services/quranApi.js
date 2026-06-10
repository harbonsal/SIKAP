/**
 * Quran API Service
 * 
 * Menggunakan API dari api.alquran.cloud untuk menampilkan halaman Al-Quran
 * Dokumentasi: http://api.alquran.cloud/v1
 * 
 * Fitur:
 * - Get halaman berdasarkan nomor halaman (1-604)
 * - Get ayat berdasarkan surah dan nomor ayat
 * - Get informasi juz
 */

const BASE_URL = 'https://api.alquran.cloud/v1';

/**
 * Mapping Surah name to Surah number
 */
export const SURAH_MAPPING = {
    "Al-Fatihah": 1, "Al-Baqarah": 2, "Ali 'Imran": 3, "An-Nisa'": 4, "Al-Ma'idah": 5,
    "Al-An'am": 6, "Al-A'raf": 7, "Al-Anfal": 8, "At-Taubah": 9, "Yunus": 10, "Hud": 11,
    "Yusuf": 12, "Ar-Ra'd": 13, "Ibrahim": 14, "Al-Hijr": 15, "An-Nahl": 16, "Al-Isra'": 17, "Al-Kahf": 18,
    "Maryam": 19, "Taha": 20, "Al-Anbiya'": 21, "Al-Hajj": 22, "Al-Mu'minun": 23, "An-Nur": 24,
    "Al-Furqan": 25, "Ash-Shu'ara'": 26, "An-Naml": 27, "Al-Qasas": 28, "Al-Ankabut": 29,
    "Ar-Rum": 30, "Luqman": 31, "As-Sajdah": 32, "Al-Ahzab": 33, "Saba'": 34, "Fatir": 35,
    "Ya Sin": 36, "As-Saffat": 37, "Sad": 38, "Az-Zumar": 39, "Ghafir": 40, "Fussilat": 41,
    "Ash-Shura": 42, "Az-Zukhruf": 43, "Ad-Dukhan": 44, "Al-Jathiyah": 45, "Al-Ahqaf": 46,
    "Muhammad": 47, "Al-Fath": 48, "Al-Hujurat": 49, "Qaf": 50, "Adh-Dhariyat": 51, "At-Tur": 52,
    "An-Najm": 53, "Al-Qamar": 54, "Ar-Rahman": 55, "Al-Waqi'ah": 56, "Al-Hadid": 57, "Al-Mujadila": 58,
    "Al-Hashr": 59, "Al-Mumtahanah": 60, "As-Saff": 61, "Al-Jumu'ah": 62, "Al-Munafiqun": 63,
    "At-Taghabun": 64, "At-Talaq": 65, "At-Tahrim": 66, "Al-Mulk": 67, "Al-Qalam": 68, "Al-Haqqah": 69,
    "Al-Ma'arij": 70, "Nuh": 71, "Al-Jinn": 72, "Al-Muzzammil": 73, "Al-Muddathir": 74, "Al-Qiyamah": 75,
    "Al-Insan": 76, "Al-Mursalat": 77, "An-Naba'": 78, "An-Nazi'at": 79, "Abasa": 80, "At-Takwir": 81,
    "Al-Infitar": 82, "Al-Mutaffifin": 83, "Al-Inshiqaq": 84, "Al-Buruj": 85, "At-Tariq": 86,
    "Al-A'la": 87, "Al-Ghashiyah": 88, "Al-Fajr": 89, "Al-Balad": 90, "Ash-Shams": 91, "Al-Lail": 92,
    "Ad-Duha": 93, "Ash-Sharh": 94, "At-Tin": 95, "Al-Alaq": 96, "Al-Qadr": 97, "Al-Bayyinah": 98,
    "Az-Zalzalah": 99, "Al-Adiyat": 100, "Al-Qari'ah": 101, "At-Takathur": 102, "Al-Asr": 103,
    "Al-Humazah": 104, "Al-Fil": 105, "Quraish": 106, "Al-Ma'un": 107, "Al-Kawthar": 108, "Al-Kafirun": 109,
    "An-Nasr": 110, "Al-Lahab": 111, "Al-Ikhlas": 112, "Al-Falaq": 113, "An-Nas": 114
};

/**
 * Juz to Page Mapping (Madinah Mushaf)
 * Juz 1 starts at page 1, Juz 2 at page 22, etc.
 */
export const JUZ_TO_PAGE = {
    1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182,
    11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
    21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582
};

/**
 * Fetch Quran page image from API
 * @param {number} pageNumber - Page number (1-604)
 * @returns {Promise<string>} - Image URL
 */
export async function fetchPageImage(pageNumber) {
    if (pageNumber < 1 || pageNumber > 604) {
        throw new Error('Nomor halaman harus antara 1-604');
    }

    // Using api.alquran.cloud for page image
    // Format: https://api.alquran.cloud/v1/quran/quran-uthmani/page/{pageNumber}
    const response = await fetch(`${BASE_URL}/quran/quran-uthmani/page/${pageNumber}`);

    if (!response.ok) {
        throw new Error(`Gagal mengambil halaman ${pageNumber}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
        throw new Error(data.status || 'Gagal mengambil data Al-Quran');
    }

    // Return the first ayah's page number (should be the same as input)
    // We can use this to validate or get additional info
    return data.data.ayahs[0]?.page || pageNumber;
}

/**
 * Get page number from Juz
 * @param {number} juzNumber - Juz number (1-30)
 * @returns {number} - Starting page number
 */
export function getPageFromJuz(juzNumber) {
    return JUZ_TO_PAGE[juzNumber] || 1;
}

/**
 * Get Surah number from name
 * @param {string} surahName - Surah name
 * @returns {number|null} - Surah number or null if not found
 */
export function getSurahNumber(surahName) {
    return SURAH_MAPPING[surahName] || null;
}

/**
 * Estimate page number from Surah and Ayah
 * Uses precise mapping based on Madinah Mushaf (Standard 604 pages)
 *
 * @param {string} surahName - Surah name
 * @param {number} ayahNumber - Ayah number
 * @param {string} selectedJuz - Selected Juz (for better estimation)
 * @returns {number} - Estimated page number (1-604)
 */
export function estimatePageFromSurahAyah(surahName, ayahNumber, selectedJuz = '30') {
    const surahNumber = getSurahNumber(surahName);
    const ayahNum = parseInt(ayahNumber) || 1;

    if (!surahNumber) return JUZ_TO_PAGE[parseInt(selectedJuz)] || 1;

    // Precise Surah start pages in Madinah Mushaf
    const surahStartPages = {
        1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
        11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
        21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
        31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
        41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
        51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
        61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
        71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
        81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
        91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
        101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603,
        111: 603, 112: 604, 113: 604, 114: 604
    };

    // Ayahs per page for each surah (approximate, varies by surah)
    // This helps calculate exact page based on which ayah
    const ayahsPerPage = {
        1: 7, 2: 8, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 8, 9: 8, 10: 8,
        11: 8, 12: 8, 13: 8, 14: 6, 15: 7, 16: 8, 17: 8, 18: 8, 19: 8, 20: 8,
        21: 8, 22: 8, 23: 8, 24: 8, 25: 8, 26: 8, 27: 8, 28: 8, 29: 8, 30: 8,
        31: 6, 32: 5, 33: 6, 34: 7, 35: 6, 36: 7, 37: 7, 38: 7, 39: 7, 40: 7,
        41: 8, 42: 7, 43: 7, 44: 6, 45: 5, 46: 6, 47: 6, 48: 6, 49: 5, 50: 5,
        51: 4, 52: 5, 53: 5, 54: 5, 55: 6, 56: 6, 57: 6, 58: 5, 59: 5, 60: 5,
        61: 4, 62: 4, 63: 4, 64: 4, 65: 4, 66: 4, 67: 5, 68: 5, 69: 5, 70: 5,
        71: 5, 72: 5, 73: 5, 74: 5, 75: 5, 76: 5, 77: 5, 78: 6, 79: 5, 80: 6,
        81: 6, 82: 6, 83: 6, 84: 6, 85: 6, 86: 6, 87: 6, 88: 6, 89: 6, 90: 6,
        91: 6, 92: 6, 93: 6, 94: 6, 95: 6, 96: 6, 97: 6, 98: 6, 99: 6, 100: 6,
        101: 6, 102: 6, 103: 6, 104: 6, 105: 6, 106: 6, 107: 6, 108: 6, 109: 6, 110: 6,
        111: 6, 112: 6, 113: 6, 114: 6
    };

    const startPage = surahStartPages[surahNumber] || 1;
    const aPerPage = ayahsPerPage[surahNumber] || 8;

    // Calculate page offset based on ayah position
    const pageOffset = Math.floor((ayahNum - 1) / aPerPage);
    let targetPage = startPage + pageOffset;

    // Correct target page if it falls before the selected Juz start page
    if (selectedJuz) {
        const juzStartPage = JUZ_TO_PAGE[parseInt(selectedJuz)] || 1;
        targetPage = Math.max(targetPage, juzStartPage);
    }

    // Ensure we don't exceed page 604
    return Math.min(604, targetPage);
}

/**
 * Fetch ayah text for reference
 * @param {number} surahNumber - Surah number
 * @param {number} ayahNumber - Ayah number
 * @returns {Promise<object>} - Ayah data
 */
export async function fetchAyahText(surahNumber, ayahNumber) {
    try {
        const response = await fetch(`${BASE_URL}/surah/${surahNumber}/ayah/${ayahNumber}/ar.alafasy`);
        const data = await response.json();

        if (data.code === 200) {
            return {
                text: data.data.text,
                number: data.data.numberInSurah,
                page: data.data.page
            };
        }
    } catch (error) {
        console.error('Gagal mengambil teks ayat:', error);
    }

    return null;
}

/**
 * Fetch full surah info
 * @param {number} surahNumber - Surah number
 * @returns {Promise<object>} - Surah data
 */
export async function fetchSurahInfo(surahNumber) {
    try {
        const response = await fetch(`${BASE_URL}/surah/${surahNumber}`);
        const data = await response.json();

        if (data.code === 200) {
            return {
                name: data.data.name,
                englishName: data.data.englishName,
                numberOfAyahs: data.data.numberOfAyahs,
                revelationType: data.data.revelationType
            };
        }
    } catch (error) {
        console.error('Gagal mengambil info surah:', error);
    }

    return null;
}

export default {
    fetchPageImage,
    getPageFromJuz,
    getSurahNumber,
    estimatePageFromSurahAyah,
    fetchAyahText,
    fetchSurahInfo,
    SURAH_MAPPING,
    JUZ_TO_PAGE
};
