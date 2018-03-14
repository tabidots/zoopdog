const wordUnitsRegex = /[a-zđaáàảạãâấầẩậẫăắằẳặẵeéèẻẹẽêếềểệễiíìỉịĩoóòỏọõôốồổộỗơớờởợỡuúùủụũưứừửựữyýỳỷỵỹ]+|\d+(\.\d{1,2})?|\S|\n/gi

const dialects = ["hanoi", "quangnam", "saigon"]

const vowelTable = {
  "a": /[aáàảạã]/g,  // g flag is necessary for the edge case of "soóc"
  "â": /[âấầẩậẫ]/g,
  "ă": /[ăắằẳặẵ]/g,
  "e": /[eéèẻẹẽ]/g,
  "ê": /[êếềểệễ]/g,
  "i": /[iíìỉịĩ]/g,
  "o": /[oóòỏọõ]/g,
  "ô": /[ôốồổộỗ]/g,
  "ơ": /[ơớờởợỡ]/g,
  "u": /[uúùủụũ]/g,
  "ư": /[ưứừửựữ]/g,
  "y": /[yýỳỷỵỹ]/g
}

const toneTable = {
  "/": /[áấắéếíóốớúứý]/,
  "\\": /[àầằèềìòồờùừỳ]/,
  "?": /[ảẩẳẻểỉỏổởủửỷ]/,
  "~": /[ãẫẵẽễĩõỗỡũữỹ]/,
  ".": /[ạậặẹệịọộợụựỵ]/,
  "‾": /[aâăeêioôơuưy]/
}

const toneCodes = {
  "/": "\u0301",
  "\\": "\u0300",
  "?": "\u0309",
  "~": "\u0303",
  ".": "\u0323",
  "‾": ""
}

const tones = {
  "‾":  {hanoi: "˧",          quangnam: "˧",         saigon: "˧"},
  "\\": {hanoi: "˨˩\u0324",   quangnam: "˧˨",        saigon: "˨˩"},
         // old Hanoi ˨˩̤
  "/":  {hanoi: "˧˥",         quangnam: "˧˥",        saigon: "˧˥"},
  "?":  {hanoi: "˧˩\u0330_",  quangnam: "˧˩˦",       saigon: "˨˩˦"},
  "~":  {hanoi: "˧ʔ˥",        quangnam: "˧˩˦",       saigon: "˨˩˦"},
         // old Hanoi ˧ˀ˥
  ".":  {hanoi: "˨˩\u0330ʔ_", quangnam: "˧˩˨\u0330", saigon: "˨˩˨\u0330"}
         // old Hanoi ˨˩̰ʔ, ˨˩̰, old QN ˧˩˨̰, old SG ˨˩˨̰
}

// TODO: What about thuê = thê in Saigonese? This would impact the homophones function as well
// TODO: Quangnam: onglide before orthographic "a" only happens after SOME consonants...? Also, oong / ooc?

const rimesToIPA = {
  "i":            {hanoi: "iː",         quangnam: "ɤ\u032Fiː",  saigon: "ɤ\u032Fiː"},
  "y":            {hanoi: "iː",         quangnam: "ɤ\u032Fiː",  saigon: "ɤ\u032Fiː"},
  "ê":            {hanoi: "ɛːe\u032F",  quangnam: "ɛːe\u032F",  saigon: "ɛːe\u032F"},
  "e":            {hanoi: "ɛː",         quangnam: "ɛː",         saigon: "ɛː"},
  "ia":           {hanoi: "iɤ",         quangnam: "iɤ",         saigon: "iɤ"},

  "u":            {hanoi: "uː",         quangnam: "o\u032Fuː",  saigon: "ʊ\u032Fuː"},
  "ô":            {hanoi: "oː",         quangnam: "oː",         saigon: "ɔ\u032Foː"},
  "o":            {hanoi: "ɔː",         quangnam: "ɔː",         saigon: "ɔː"},
  "ua":           {hanoi: "uɤ",         quangnam: "uɤ",         saigon: "uːɤ\u032F"},

  "ư":            {hanoi: "ɯː",         quangnam: "ɤ\u032Fɨː",  saigon: "ɪ̈\u032Fɯː"},
  "ơ":            {hanoi: "ɤː",         quangnam: "ɤː",         saigon: "ɜ\u032Fɤː"},
  "a":            {hanoi: "aː",         quangnam: "ɔ\u032Fɑː",  saigon: "a\u031Fː"},
  "ưa":           {hanoi: "ɯɤ",         quangnam: "ɨɤ",         saigon: "ɯːɤ\u032F"},

  "uôi":          {hanoi: "uɤj",        quangnam: "uːj",        saigon: "uːj"},
  "ươi":          {hanoi: "ɯɤj",        quangnam: "ɨːj",        saigon: "ɯːj"},
  "ươu":          {hanoi: "iːw",        quangnam: "uːj",        saigon: "ɯːw"},
  "iêu":          {hanoi: "iːw",        quangnam: "iːw",        saigon: "iːw"},

  "oi":           {hanoi: "ɑːj",        quangnam: "uɤ",         saigon: "ɑːʷj"},
  "ôi":           {hanoi: "ɔːj",        quangnam: "ɔːj",        saigon: "ɔːj"},
  "ui":           {hanoi: "uːj",        quangnam: "uːj",        saigon: "uːj"},

  "eo":           {hanoi: "ɛːw",        quangnam: "eːw",        saigon: "ɛːw"},
  "êu":           {hanoi: "eːw",        quangnam: "iːw",        saigon: "eːw"},
  "iu":           {hanoi: "iw",         quangnam: "iːw",        saigon: "iːw"},

  "ưi":           {hanoi: "ɯːj",        quangnam: "ɨːj",        saigon: "ɯːj"},
  "ưu":           {hanoi: "iw",         quangnam: "ɨːw",        saigon: "ɯːw"},
  "ơi":           {hanoi: "ɤːj",        quangnam: "ɤːj",        saigon: "ɤːj"},

  "ai":           {hanoi: "aːj",        quangnam: "ɨɤ",         saigon: "æːj"},
  "ao":           {hanoi: "aːw",        quangnam: "oː",         saigon: "a\u031Fːw"},

  "ay":           {hanoi: "aj",         quangnam: "aː",         saigon: "æːj"},
  "au":           {hanoi: "aw",         quangnam: "aː",         saigon: "a\u031Fːw"},

  "ây":           {hanoi: "ʌj",         quangnam: "aːj",        saigon: "ʌj"},
  "âu":           {hanoi: "ʌw",         quangnam: "aːw",        saigon: "ʌw"},

  "am":           {hanoi: "aːm",        quangnam: "ɔːm",        saigon: "a\u031Fːm"},
  "ap":           {hanoi: "aːp",        quangnam: "ɔːp",        saigon: "a\u031Fːp"},

  "om":           {hanoi: "ɔːm",        quangnam: "ɔːm",        saigon: "ɑːm"},
  "op":           {hanoi: "ɔːp",        quangnam: "ɔːp",        saigon: "ɑːʷp"},

  "ôm":           {hanoi: "oːm",        quangnam: "ɔːm",        saigon: "ɔːm"},
  "ôp":           {hanoi: "oːp",        quangnam: "ɔːp",        saigon: "ɔːp"},

  "um":           {hanoi: "uːm",        quangnam: "ɨm",         saigon: "ʊm"},
  "up":           {hanoi: "uːp",        quangnam: "ɨp",         saigon: "ʊp"},

  "âm":           {hanoi: "ʌm",         quangnam: "ʌm",         saigon: "a\u031Fm"},
  "âp":           {hanoi: "ʌp",         quangnam: "ʌp",         saigon: "a\u031Fp"},
  "ăm":           {hanoi: "am",         quangnam: "ɑːm",        saigon: "a\u031Fm"},
  "ăp":           {hanoi: "ap",         quangnam: "ɑːp",        saigon: "a\u031Fp"},
  "ơm":           {hanoi: "ɤːm",        quangnam: "ɤːm",        saigon: "ɤːm"},
  "ơp":           {hanoi: "ɤːp",        quangnam: "ɤːp",        saigon: "ɤːp"},

  "uôm":          {hanoi: "uɤm",        quangnam: "ɔːm",        saigon: "ɤːm"},
  "uôp":          {hanoi: "uɤp",        quangnam: "ɔːp",        saigon: "ɤːp"},
  "ươm":          {hanoi: "ɯɤm",        quangnam: "ɨːm",        saigon: "ɯːm"},
  "ươp":          {hanoi: "ɯɤp",        quangnam: "ɨːp",        saigon: "ɯːp"},

  "em":           {hanoi: "ɛːm",        quangnam: "ɛːi\u032Fm", saigon: "æa\u032Fm"},
  "ep":           {hanoi: "ɛːp",        quangnam: "ɛːi\u032Fp", saigon: "æa\u032Fp"},
  "êm":           {hanoi: "eːm",        quangnam: "ɛːi\u032Fm", saigon: "ɛːm"},
  "êp":           {hanoi: "eːp",        quangnam: "ɛːi\u032Fp", saigon: "ɛːp"},

  "iêm":          {hanoi: "iɤm",        quangnam: "iːm",        saigon: "iːm"},
  "iêp":          {hanoi: "iɤp",        quangnam: "iːp",        saigon: "iːp"},
  "im":           {hanoi: "iːm",        quangnam: "iːm",        saigon: "iːm"},
  "ip":           {hanoi: "iːp",        quangnam: "iːp",        saigon: "iːp"},

  "an":           {hanoi: "aːn",        quangnam: "ɔːŋ",        saigon: "æːŋ"},
  "at":           {hanoi: "aːt",        quangnam: "ɔːk",        saigon: "æːk"},
  "ang":          {hanoi: "aːŋ",        quangnam: "ɔːŋ",        saigon: "æːŋ"},
  "ac":           {hanoi: "aːk",        quangnam: "ɔːk",        saigon: "æːk"},

  "on":           {hanoi: "ɔːn",        quangnam: "ɔːŋ",        saigon: "ɔːŋ"},
  "ot":           {hanoi: "ɔːt",        quangnam: "ɔːʷk",       saigon: "ɑːk"},
  "oong":         {hanoi: "ɔːŋ",        quangnam: "ɔːŋ",        saigon: "ɔːŋ"},
  "ooc":          {hanoi: "ɔːk",        quangnam: "ɔːʷk",       saigon: "ɔːk"},
  "ong":          {hanoi: "ɑʷŋ͡m",       quangnam: "ɑːŋ",        saigon: "ɑʷŋ͡m"},
  "oc":           {hanoi: "ɑʷk͡p",       quangnam: "ɑːk",        saigon: "ɑʷk͡p"},

  "ôn":           {hanoi: "oːn",        quangnam: "ɔːŋ",        saigon: "oŋ͡m"},
  "ôt":           {hanoi: "oːt",        quangnam: "ɔːʷk",       saigon: "ɔʷk͡p"},
  "ông":          {hanoi: "ɤʷŋ͡m",       quangnam: "ɔːŋ͡m",       saigon: "ɔŋ͡m"},
  "ôc":           {hanoi: "ɤʷk͡p",       quangnam: "ɔːk͡p",       saigon: "ɔʷk͡p"},

  "ung":          {hanoi: "ʊʷŋ͡m",       quangnam: "ʊʷŋ͡m",       saigon: "ʊŋ͡m"},
  "uc":           {hanoi: "ʊʷk͡p",       quangnam: "ʊʷk͡p",       saigon: "ʊk͡p"},

  "ơn":           {hanoi: "ɤːn",        quangnam: "ɤːʊ\u032Fŋ", saigon: "ɤːŋ"},
  "ơt":           {hanoi: "ɤːt",        quangnam: "ɤːʊ\u032Fk", saigon: "ɤːk"},

  "ân":           {hanoi: "ʌn",         quangnam: "ʌŋ",         saigon: "ʌŋ"},
  "ât":           {hanoi: "ʌt",         quangnam: "ʌk",         saigon: "ʌk"},
  "âng":          {hanoi: "ʌŋ",         quangnam: "ʌŋ",         saigon: "ʌŋ"},
  "âc":           {hanoi: "ʌk",         quangnam: "ʌk",         saigon: "ʌk"},

  "en":           {hanoi: "ɛːn",        quangnam: "ɛːa\u032Fŋ", saigon: "ɛa\u032Fŋ"},
  "et":           {hanoi: "ɛːt",        quangnam: "ɛːa\u032Fk", saigon: "ɛa\u032Fk"},
  "eng":          {hanoi: "ɛːŋ",        quangnam: "ɛːa\u032Fŋ", saigon: "ɛa\u032Fŋ"},
  "ec":           {hanoi: "ɛːk",        quangnam: "ɛːa\u032Fk", saigon: "ɛa\u032Fk"},

  "ăn":           {hanoi: "an",         quangnam: "æːa\u032Fŋ", saigon: "a\u031Fŋ"},
  "ăt":           {hanoi: "at",         quangnam: "æːk",        saigon: "a\u031Fk"},
  "ăng":          {hanoi: "aŋ",         quangnam: "æːa\u032Fŋ", saigon: "a\u031Fŋ"},
  "ăc":           {hanoi: "ak",         quangnam: "æːk",        saigon: "a\u031Fk"},

  "ên":           {hanoi: "eːn",        quangnam: "ɛːi\u032Fŋ", saigon: "ɤːn"},
  "êt":           {hanoi: "eːt",        quangnam: "ɛːi\u032Fk", saigon: "ɤːt"},
  "in":           {hanoi: "iːn",        quangnam: "iŋ",         saigon: "ɪ̈n"},
  "it":           {hanoi: "it",         quangnam: "ik",         saigon: "ɪ̈t"},

  "un":           {hanoi: "uːn",        quangnam: "uːŋ",        saigon: "ʊŋ͡m"},
  "ut":           {hanoi: "uːt",        quangnam: "uːk",        saigon: "ʊk͡p"},
  "uôn":          {hanoi: "uɤn",        quangnam: "uːŋ",        saigon: "uːŋ"},
  "uôt":          {hanoi: "uɤt",        quangnam: "uːk",        saigon: "uːk"},
  "uông":         {hanoi: "uɤŋ",        quangnam: "uːŋ",        saigon: "uːŋ"},
  "uôc":          {hanoi: "uɤk",        quangnam: "uːk",        saigon: "uːk"},

  "iên":          {hanoi: "iɤn",        quangnam: "iːe\u032Fŋ", saigon: "iːŋ"},
  "iêt":          {hanoi: "iɤt",        quangnam: "iːe\u032Fk", saigon: "iːk"},
  "iêng":         {hanoi: "iɤŋ",        quangnam: "iːe\u032Fŋ", saigon: "iːŋ"},
  "iêc":          {hanoi: "iɤk",        quangnam: "iːe\u032Fk", saigon: "iːk"},

  "ươn":          {hanoi: "ɯɤn",        quangnam: "ɨːŋ",        saigon: "ɯːŋ"},
  "ươt":          {hanoi: "ɯɤt",        quangnam: "ɨːk",        saigon: "ɯːk"},
  "ương":         {hanoi: "ɯɤŋ",        quangnam: "ɨːŋ",        saigon: "ɯːŋ"},
  "ươc":          {hanoi: "ɯɤk",        quangnam: "ɨːk",        saigon: "ɯːk"},

  "ưn":           {hanoi: "ɪ̈n",         quangnam: "ɨŋ",         saigon: "ɪ̈ŋ"}, // TODO: SGN?
  "ưt":           {hanoi: "ɪ̈t",         quangnam: "ɨk",         saigon: "ɪ̈k"},
  "ưng":          {hanoi: "ɪ̈ŋ",         quangnam: "ɨŋ",         saigon: "ɪ̈ŋ"},
  "ưc":           {hanoi: "ɪ̈k",         quangnam: "ɨk",         saigon: "ɪ̈k"},

  "anh":          {hanoi: "ɛi\u032Fŋ",  quangnam: "an",         saigon: "a\u031Fn"},
  "ach":          {hanoi: "ɛi\u032Fk",  quangnam: "at",         saigon: "a\u031Ft"},

  "ênh":          {hanoi: "ɤi\u032Fŋ",  quangnam: "ɛi\u032Fŋ",  saigon: "ɤːn"},
  "êch":          {hanoi: "ɤi\u032Fk",  quangnam: "ɛi\u032Fk",  saigon: "ɤːt"},

  "inh":          {hanoi: "iŋ",         quangnam: "ɨn",         saigon: "ɪ̈n"},
  "ich":          {hanoi: "ɪk",         quangnam: "ɨt",         saigon: "ɪ̈t"}
}

const initialsToIPA = {
  "b":            {hanoi: "ʔɓ",         quangnam: "ɓ",          saigon: "ɓ"},
  "c":            {hanoi: "k",          quangnam: "k",          saigon: "k"},
  "ch":           {hanoi: "t͡ɕ",         quangnam: "c",          saigon: "c"},
  "d":            {hanoi: "z",          quangnam: "j",          saigon: "j"},
  "đ":            {hanoi: "ʔɗ",         quangnam: "ɗ",          saigon: "ɗ"},
  "g":            {hanoi: "ɣ",          quangnam: "ɣ",          saigon: "g"},
  "gh":           {hanoi: "ɣ",          quangnam: "ɣ",          saigon: "g"},
  "gi":           {hanoi: "z",          quangnam: "j",          saigon: "j"},
  "h":            {hanoi: "h",          quangnam: "h",          saigon: "h"},
  "k":            {hanoi: "k",          quangnam: "k",          saigon: "k"},
  "kh":           {hanoi: "x",          quangnam: "kʰ",         saigon: "kʰ"},
  "l":            {hanoi: "l",          quangnam: "l",          saigon: "l"},
  "m":            {hanoi: "m",          quangnam: "m",          saigon: "m"},
  "n":            {hanoi: "n",          quangnam: "n",          saigon: "n"},
  "ng":           {hanoi: "ŋ",          quangnam: "ŋ",          saigon: "ŋ"},
  "ngh":          {hanoi: "ŋ",          quangnam: "ŋ",          saigon: "ŋ"},
  "nh":           {hanoi: "ɲ",          quangnam: "ɲ",          saigon: "ɲ"},
  "p":            {hanoi: "ʔɓ",         quangnam: "ɓ",          saigon: "ɓ"},
  "ph":           {hanoi: "f",          quangnam: "f",          saigon: "f"},
  "qu":           {hanoi: "kʷ",         quangnam: "kʷ",         saigon: "kʷ"},
  "r":            {hanoi: "z",          quangnam: "ɻ",          saigon: "ɻ"},
  "s":            {hanoi: "s",          quangnam: "ʂ",          saigon: "ʂ"},
  "t":            {hanoi: "t",          quangnam: "t",          saigon: "t"},
  "th":           {hanoi: "tʰ",         quangnam: "tʰ",         saigon: "tʰ"},
  "tr":           {hanoi: "t͡ɕ",         quangnam: "ʈ͡ʂ",         saigon: "ʈ͡ʂ"},
  "v":            {hanoi: "v",          quangnam: "v",          saigon: "j"},
  "x":            {hanoi: "s",          quangnam: "s",          saigon: "s"}
}

const numbers = {
  "0":            {hanoi: "linh",       quangnam: "linh",       saigon: "lẻ"},
  "1":            {hanoi: "một",        quangnam: "một",        saigon: "một"},
  "2":            {hanoi: "hai",        quangnam: "hai",        saigon: "hai"},
  "3":            {hanoi: "ba",         quangnam: "ba",         saigon: "ba"},
  "4":            {hanoi: "bốn",        quangnam: "bốn",        saigon: "bốn"},
  "5":            {hanoi: "năm",        quangnam: "năm",        saigon: "năm"},
  "6":            {hanoi: "sáu",        quangnam: "sáu",        saigon: "sáu"},
  "7":            {hanoi: "bảy",        quangnam: "bảy",        saigon: "bảy"},
  "8":            {hanoi: "tám",        quangnam: "tám",        saigon: "tám"},
  "9":            {hanoi: "chín",       quangnam: "chín",       saigon: "chín"},
  "10":           {hanoi: "mười",       quangnam: "mười",       saigon: "mười"},
  "100":          {hanoi: "trăm",       quangnam: "trăm",       saigon: "trăm"},
  "1000":         {hanoi: "nghìn",      quangnam: "ngà",        saigon: "ngàn"},
  "1000000":      {hanoi: "triệu",      quangnam: "triệu",      saigon: "triệu"},
  "1000000000":   {hanoi: "tỷ",         quangnam: "tỷ",         saigon: "tỷ"}
}

const zoopdogSymbols = {
  // CONSONANTS
  "ʔɓ": "b",
  "ɓ": "b",
  "c": "ᴛʏ",
  "t͡ɕ": "ᴄʜ",
  "ʈ͡ʂ": "ᴄʜ",
  "ʔɗ": "d",
  "ɗ": "d",
  "ɣ": "ġ",
  "x": "ᴋʜ",
  "ɲ": "ny",
  "ɻ": "ᴙ",
  "ʂ": "sh",
  "ŋ": "ng",
  "ŋ͡m": "ng*",
  "k͡p": "k*",

  // SEMIVOWELS
  "j": "i",
  "w": "u",
  "W": "w",

  // VOWELS
  "ɯ": "ư",

  "ɪ̈": "ŭ",
  "ɨ": "ŭ",
  "ʊ": "ŭ",

  "ʌ": "ɐ",
  "ɤ": "ə˞",
  "ɑ": "å",

  "e": "ê",
  "ɛ": "ĕ",

  "ɜ": "ə" // minor ɤ also gets simplified to ə
}
