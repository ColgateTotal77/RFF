#include <stddef.h>
#include "utf8.h"
#include "utf8proc/utf8proc.h"

static CpClass cp_classify(uint32_t cp);

typedef struct { uint32_t min, max; } CpRange;

static const CpRange UNSPACED_RANGES[] = {
    { 0x00E00, 0x00E7F },  /* Thai                                     */
    { 0x00E80, 0x00EFF },  /* Lao                                      */
    { 0x00F00, 0x00FFF },  /* Tibetan                                  */
    { 0x01000, 0x0109F },  /* Myanmar                                  */
    { 0x01780, 0x017FF },  /* Khmer                                    */
    { 0x01980, 0x019DF },  /* New Tai Lue                              */
    { 0x03040, 0x030FF },  /* Hiragana + Katakana                      */
    { 0x03400, 0x04DBF },  /* CJK Unified Ideographs Extension A       */
    { 0x04E00, 0x09FFF },  /* CJK Unified Ideographs                   */
    { 0x0A000, 0x0A4CF },  /* Yi                                       */
    { 0x0A980, 0x0A9DF },  /* Javanese                                 */
    { 0x0AC00, 0x0D7AF },  /* Hangul syllables                         */
    { 0x0F900, 0x0FAFF },  /* CJK Compatibility Ideographs             */
    { 0x1B000, 0x1B16F },  /* Kana supplement / extended               */
    { 0x20000, 0x2FA1F },  /* CJK Extensions B–F + Compatibility Supp. */
};
static const size_t UNSPACED_RANGES_LEN =
    sizeof UNSPACED_RANGES / sizeof UNSPACED_RANGES[0];

typedef struct { uint32_t cp, key; } Joiner;

static const Joiner MEDIAL_JOINERS[] = {
    { 0x0027, 0x0027 },  /* '  apostrophe            don't, м'ясо           */
    { 0x2019, 0x0027 },  /* ’  right single quote    the typeset apostrophe */
    { 0x02BC, 0x0027 },  /* ʼ  modifier apostrophe   Ukrainian, Cherokee    */
    { 0x055A, 0x0027 },  /* ՚  Armenian apostrophe                          */
    { 0x05F3, 0x0027 },  /* ׳  Hebrew geresh                                */
    { 0x002D, 0x002D },  /* -  hyphen-minus          mother-in-law          */
    { 0x2010, 0x002D },  /* ‐  hyphen                                       */
    { 0x2011, 0x002D },  /* ‑  non-breaking hyphen                          */
    { 0x00B7, 0x00B7 },  /* ·  middle dot            Catalan l·l            */
};
static const size_t MEDIAL_JOINERS_LEN =
    sizeof MEDIAL_JOINERS / sizeof MEDIAL_JOINERS[0];

static bool medial_key(uint32_t cp, uint32_t* key) {
    if (cp < 0x0027 || cp > 0x2019) return false;

    for (size_t i = 0; i < MEDIAL_JOINERS_LEN; i++) {
        if (MEDIAL_JOINERS[i].cp == cp) {
            if (key) *key = MEDIAL_JOINERS[i].key;
            return true;
        }
    }
    return false;
}

static utf8proc_ssize_t cp_avail(const char* p) {
    for (utf8proc_ssize_t i = 0; i < UTF8_MAX_BYTES; i++) {
        if (p[i] == '\0') return i;
    }
    return UTF8_MAX_BYTES;
}

uint32_t cp_at(const char* p, const char** next) {
    if (p == NULL || *p == '\0') {
        if (next) *next = p;
        return 0;
    }

    utf8proc_int32_t cp;
    utf8proc_ssize_t n =
        utf8proc_iterate((const utf8proc_uint8_t*)p, cp_avail(p), &cp);

    if (n <= 0 || cp < 0) {
        if (next) *next = p + 1;
        return 0xFFFDu;
    }

    if (next) *next = p + n;
    return (uint32_t)cp;
}

CpClass cp_word_class(const char* p, CpClass prev, const char** next) {
    const char* q;
    uint32_t cp = cp_at(p, &q);
    if (next) *next = q;

    if (medial_key(cp, NULL)) {
        bool joins = prev == CP_ALPHA && cp_classify(cp_at(q, NULL)) == CP_ALPHA;
        return joins ? CP_ALPHA : CP_NONE;
    }
    return cp_classify(cp);
}

static CpClass cp_classify(uint32_t cp) {
    for (size_t i = 0; i < UNSPACED_RANGES_LEN; i++) {
        if (cp <  UNSPACED_RANGES[i].min) break;
        if (cp <= UNSPACED_RANGES[i].max) return CP_UNSPACED;
    }

    switch (utf8proc_category((utf8proc_int32_t)cp)) {
        case UTF8PROC_CATEGORY_LU:
        case UTF8PROC_CATEGORY_LL:
        case UTF8PROC_CATEGORY_LT:
        case UTF8PROC_CATEGORY_LM:
        case UTF8PROC_CATEGORY_LO:
        case UTF8PROC_CATEGORY_ND:
        case UTF8PROC_CATEGORY_NL:
        case UTF8PROC_CATEGORY_NO:
        case UTF8PROC_CATEGORY_MN:
        case UTF8PROC_CATEGORY_MC:
        case UTF8PROC_CATEGORY_ME:
            return CP_ALPHA;
        default:
            return CP_NONE;
    }
}

bool cp_is_space(uint32_t cp) {
    if (cp == 0x20) return true;
    if (cp >= 0x09 && cp <= 0x0D) return true;

    switch (utf8proc_category((utf8proc_int32_t)cp)) {
        case UTF8PROC_CATEGORY_ZS:
        case UTF8PROC_CATEGORY_ZL:
        case UTF8PROC_CATEGORY_ZP:
            return true;
        default:
            return false;
    }
}

uint32_t cp_fold_key(uint32_t cp) {
    uint32_t key;
    if (medial_key(cp, &key)) return key;

    utf8proc_int32_t lower = utf8proc_tolower((utf8proc_int32_t)cp);
    return lower < 0 ? cp : (uint32_t)lower;
}
