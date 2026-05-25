/**
 * India Location Data — State → District → City cascading hierarchy.
 * Covers all major states and their top districts/cities where PG demand exists.
 * This is used in the Add PG form for cascading dropdowns.
 */

export interface IndiaLocationData {
  [state: string]: {
    [district: string]: string[];
  };
}

export const INDIA_LOCATIONS: IndiaLocationData = {
  "Andhra Pradesh": {
    "Anantapur": [
      "Anantapur",
      "Guntakal",
      "Hindupur",
      "Dharmavaram"
    ],
    "Chittoor": [
      "Tirupati",
      "Chittoor",
      "Madanapalle",
      "Srikalahasti"
    ],
    "East Godavari": [
      "Rajahmundry",
      "Kakinada",
      "Amalapuram",
      "Samalkot"
    ],
    "Guntur": [
      "Guntur",
      "Tenali",
      "Mangalagiri",
      "Narasaraopet"
    ],
    "Krishna": [
      "Vijayawada",
      "Machilipatnam",
      "Gudivada",
      "Nuzvid"
    ],
    "Kurnool": [
      "Kurnool",
      "Nandyal",
      "Adoni",
      "Yemmiganur"
    ],
    "Nellore": [
      "Nellore",
      "Gudur",
      "Kavali",
      "Sullurpeta"
    ],
    "Prakasam": [
      "Ongole",
      "Chirala",
      "Markapur",
      "Kandukur"
    ],
    "Srikakulam": [
      "Srikakulam",
      "Narasannapeta",
      "Palasa",
      "Amadalavalasa"
    ],
    "Visakhapatnam": [
      "Visakhapatnam",
      "Anakapalle",
      "Narsipatnam",
      "Bheemunipatnam"
    ],
    "Vizianagaram": [
      "Vizianagaram",
      "Bobbili",
      "Rajam",
      "Parvathipuram"
    ],
    "West Godavari": [
      "Eluru",
      "Bhimavaram",
      "Tadepalligudem",
      "Tanuku"
    ],
    "YSR Kadapa": [
      "Kadapa",
      "Proddatur",
      "Rajampet",
      "Mydukur"
    ],
    "Kadapa": [
      "Kadapa"
    ]
  },
  "Arunachal Pradesh": {
    "Papum Pare": [
      "Itanagar",
      "Naharlagun"
    ],
    "Changlang": [
      "Changlang",
      "Miao"
    ],
    "East Siang": [
      "Pasighat"
    ],
    "West Kameng": [
      "Bomdila",
      "Tawang"
    ],
    "Anjaw": [
      "Anjaw"
    ],
    "Central Siang": [
      "Central Siang"
    ],
    "Dibang Valley": [
      "Dibang Valley"
    ],
    "East Kameng": [
      "East Kameng"
    ],
    "Kamle": [
      "Kamle"
    ],
    "Kra Daadi": [
      "Kra Daadi"
    ],
    "Kurung Kumey": [
      "Kurung Kumey"
    ],
    "Lepa Rada": [
      "Lepa Rada"
    ],
    "Lohit": [
      "Lohit"
    ],
    "Longding": [
      "Longding"
    ],
    "Lower Dibang Valley": [
      "Lower Dibang Valley"
    ],
    "Lower Siang": [
      "Lower Siang"
    ],
    "Lower Subansiri": [
      "Lower Subansiri"
    ],
    "Namsai": [
      "Namsai"
    ],
    "Pakke Kessang": [
      "Pakke Kessang"
    ],
    "Shi Yomi": [
      "Shi Yomi"
    ],
    "Tawang": [
      "Tawang"
    ],
    "Tirap": [
      "Tirap"
    ],
    "Upper Siang": [
      "Upper Siang"
    ],
    "Upper Subansiri": [
      "Upper Subansiri"
    ],
    "West Siang": [
      "West Siang"
    ]
  },
  "Assam": {
    "Kamrup Metropolitan": [
      "Guwahati",
      "Dispur"
    ],
    "Nagaon": [
      "Nagaon",
      "Hojai"
    ],
    "Dibrugarh": [
      "Dibrugarh",
      "Naharkatia"
    ],
    "Jorhat": [
      "Jorhat",
      "Titabor"
    ],
    "Sonitpur": [
      "Tezpur",
      "Rangapara"
    ],
    "Cachar": [
      "Silchar",
      "Karimganj"
    ],
    "Tinsukia": [
      "Tinsukia",
      "Digboi"
    ],
    "Bajali": [
      "Bajali"
    ],
    "Baksa": [
      "Baksa"
    ],
    "Barpeta": [
      "Barpeta"
    ],
    "Biswanath": [
      "Biswanath"
    ],
    "Bongaigaon": [
      "Bongaigaon"
    ],
    "Charaideo": [
      "Charaideo"
    ],
    "Chirang": [
      "Chirang"
    ],
    "Darrang": [
      "Darrang"
    ],
    "Dhemaji": [
      "Dhemaji"
    ],
    "Dhubri": [
      "Dhubri"
    ],
    "Dima Hasao": [
      "Dima Hasao"
    ],
    "Goalpara": [
      "Goalpara"
    ],
    "Golaghat": [
      "Golaghat"
    ],
    "Hailakandi": [
      "Hailakandi"
    ],
    "Hojai": [
      "Hojai"
    ],
    "Kamrup": [
      "Kamrup"
    ],
    "Karbi Anglong": [
      "Karbi Anglong"
    ],
    "Karimganj": [
      "Karimganj"
    ],
    "Kokrajhar": [
      "Kokrajhar"
    ],
    "Lakhimpur": [
      "Lakhimpur"
    ],
    "Majuli": [
      "Majuli"
    ],
    "Morigaon": [
      "Morigaon"
    ],
    "Nalbari": [
      "Nalbari"
    ],
    "Sivasagar": [
      "Sivasagar"
    ],
    "South Salmara -Mankachar": [
      "South Salmara -Mankachar"
    ],
    "Udalguri": [
      "Udalguri"
    ],
    "West Karbi Anglong": [
      "West Karbi Anglong"
    ]
  },
  "Bihar": {
    "Patna": [
      "Patna",
      "Danapur",
      "Phulwari Sharif",
      "Khagaul",
      "Masaurhi"
    ],
    "Gaya": [
      "Gaya",
      "Bodh Gaya",
      "Sherghati"
    ],
    "Muzaffarpur": [
      "Muzaffarpur",
      "Hajipur"
    ],
    "Bhagalpur": [
      "Bhagalpur",
      "Naugachhia"
    ],
    "Darbhanga": [
      "Darbhanga",
      "Laheriasarai"
    ],
    "Purnia": [
      "Purnia",
      "Kishanganj"
    ],
    "Nalanda": [
      "Bihar Sharif",
      "Rajgir"
    ],
    "Begusarai": [
      "Begusarai",
      "Barauni"
    ],
    "Vaishali": [
      "Hajipur",
      "Mahatma Gandhi Setu"
    ],
    "Saran": [
      "Chapra",
      "Revelganj"
    ],
    "Araria": [
      "Araria"
    ],
    "Arwal": [
      "Arwal"
    ],
    "Aurangabad": [
      "Aurangabad"
    ],
    "Banka": [
      "Banka"
    ],
    "Bhojpur": [
      "Bhojpur"
    ],
    "Buxar": [
      "Buxar"
    ],
    "East Champaran": [
      "East Champaran"
    ],
    "Gopalganj": [
      "Gopalganj"
    ],
    "Jamui": [
      "Jamui"
    ],
    "Jehanabad": [
      "Jehanabad"
    ],
    "Kaimur": [
      "Kaimur"
    ],
    "Katihar": [
      "Katihar"
    ],
    "Khagaria": [
      "Khagaria"
    ],
    "Kishanganj": [
      "Kishanganj"
    ],
    "Lakhisarai": [
      "Lakhisarai"
    ],
    "Madhepura": [
      "Madhepura"
    ],
    "Madhubani": [
      "Madhubani"
    ],
    "Munger": [
      "Munger"
    ],
    "Nawada": [
      "Nawada"
    ],
    "Rohtas": [
      "Rohtas"
    ],
    "Saharsa": [
      "Saharsa"
    ],
    "Samastipur": [
      "Samastipur"
    ],
    "Sheikhpura": [
      "Sheikhpura"
    ],
    "Sheohar": [
      "Sheohar"
    ],
    "Sitamarhi": [
      "Sitamarhi"
    ],
    "Siwan": [
      "Siwan"
    ],
    "Supaul": [
      "Supaul"
    ],
    "West Champaran": [
      "West Champaran"
    ]
  },
  "Chhattisgarh": {
    "Raipur": [
      "Raipur",
      "Naya Raipur",
      "Arang"
    ],
    "Bilaspur": [
      "Bilaspur",
      "Mungeli"
    ],
    "Durg": [
      "Durg",
      "Bhilai",
      "Rajnandgaon"
    ],
    "Korba": [
      "Korba"
    ],
    "Raigarh": [
      "Raigarh"
    ],
    "Balod": [
      "Balod"
    ],
    "Baloda Bazar": [
      "Baloda Bazar"
    ],
    "Balrampur": [
      "Balrampur"
    ],
    "Bastar": [
      "Bastar"
    ],
    "Bemetara": [
      "Bemetara"
    ],
    "Bijapur": [
      "Bijapur"
    ],
    "Dantewada": [
      "Dantewada"
    ],
    "Dhamtari": [
      "Dhamtari"
    ],
    "Gariaband": [
      "Gariaband"
    ],
    "Gaurela Pendra Marwahi": [
      "Gaurela Pendra Marwahi"
    ],
    "Janjgir Champa": [
      "Janjgir Champa"
    ],
    "Jashpur": [
      "Jashpur"
    ],
    "Kabirdham": [
      "Kabirdham"
    ],
    "Kanker": [
      "Kanker"
    ],
    "Kondagaon": [
      "Kondagaon"
    ],
    "Koriya": [
      "Koriya"
    ],
    "Mahasamund": [
      "Mahasamund"
    ],
    "Mungeli": [
      "Mungeli"
    ],
    "Narayanpur": [
      "Narayanpur"
    ],
    "Rajnandgaon": [
      "Rajnandgaon"
    ],
    "Sukma": [
      "Sukma"
    ],
    "Surajpur": [
      "Surajpur"
    ],
    "Surguja": [
      "Surguja"
    ]
  },
  "Delhi": {
    "Central Delhi": [
      "Connaught Place",
      "Karol Bagh",
      "Chandni Chowk",
      "ITO"
    ],
    "New Delhi": [
      "New Delhi",
      "Sarojini Nagar",
      "Lajpat Nagar",
      "Hauz Khas",
      "Green Park"
    ],
    "South Delhi": [
      "Mehrauli",
      "Vasant Kunj",
      "Saket",
      "Malviya Nagar",
      "Greater Kailash"
    ],
    "South West Delhi": [
      "Dwarka",
      "Najafgarh",
      "Janakpuri",
      "Palam"
    ],
    "West Delhi": [
      "Rajouri Garden",
      "Punjabi Bagh",
      "Tilak Nagar",
      "Uttam Nagar"
    ],
    "North Delhi": [
      "Civil Lines",
      "Model Town",
      "GTB Nagar",
      "Mukherjee Nagar"
    ],
    "North West Delhi": [
      "Rohini",
      "Pitampura",
      "Shalimar Bagh",
      "Mangolpuri"
    ],
    "North East Delhi": [
      "Seelampur",
      "Shahdara",
      "Loni"
    ],
    "East Delhi": [
      "Preet Vihar",
      "Mayur Vihar",
      "Laxmi Nagar",
      "Pandav Nagar"
    ],
    "Shahdara": [
      "Shahdara"
    ],
    "South East Delhi": [
      "South East Delhi"
    ]
  },
  "Goa": {
    "North Goa": [
      "Panaji",
      "Mapusa",
      "Calangute",
      "Vasco da Gama",
      "Ponda"
    ],
    "South Goa": [
      "Margao",
      "Vasco da Gama",
      "Quepem",
      "Canacona"
    ]
  },
  "Gujarat": {
    "Ahmedabad": [
      "Ahmedabad",
      "Gandhinagar",
      "Sanand",
      "Bavla"
    ],
    "Surat": [
      "Surat",
      "Navsari",
      "Bardoli"
    ],
    "Vadodara": [
      "Vadodara",
      "Karjan",
      "Padra"
    ],
    "Rajkot": [
      "Rajkot",
      "Morbi",
      "Gondal"
    ],
    "Bhavnagar": [
      "Bhavnagar",
      "Palitana"
    ],
    "Jamnagar": [
      "Jamnagar",
      "Dwarka"
    ],
    "Junagadh": [
      "Junagadh",
      "Veraval",
      "Somnath"
    ],
    "Kutch": [
      "Bhuj",
      "Mundra",
      "Gandhidham"
    ],
    "Mehsana": [
      "Mehsana",
      "Patan"
    ],
    "Anand": [
      "Anand",
      "Vidyanagar",
      "Borsad"
    ],
    "Amreli": [
      "Amreli"
    ],
    "Aravalli": [
      "Aravalli"
    ],
    "Banaskantha": [
      "Banaskantha"
    ],
    "Bharuch": [
      "Bharuch"
    ],
    "Botad": [
      "Botad"
    ],
    "Chhota Udaipur": [
      "Chhota Udaipur"
    ],
    "Dahod": [
      "Dahod"
    ],
    "Dang": [
      "Dang"
    ],
    "Devbhoomi Dwarka": [
      "Devbhoomi Dwarka"
    ],
    "Gandhinagar": [
      "Gandhinagar"
    ],
    "Gir Somnath": [
      "Gir Somnath"
    ],
    "Kheda": [
      "Kheda"
    ],
    "Mahisagar": [
      "Mahisagar"
    ],
    "Morbi": [
      "Morbi"
    ],
    "Narmada": [
      "Narmada"
    ],
    "Navsari": [
      "Navsari"
    ],
    "Panchmahal": [
      "Panchmahal"
    ],
    "Patan": [
      "Patan"
    ],
    "Porbandar": [
      "Porbandar"
    ],
    "Sabarkantha": [
      "Sabarkantha"
    ],
    "Surendranagar": [
      "Surendranagar"
    ],
    "Tapi": [
      "Tapi"
    ],
    "Valsad": [
      "Valsad"
    ]
  },
  "Haryana": {
    "Gurugram": [
      "Gurugram",
      "Manesar",
      "Sohna",
      "Pataudi"
    ],
    "Faridabad": [
      "Faridabad",
      "Ballabgarh"
    ],
    "Panchkula": [
      "Panchkula",
      "Kalka"
    ],
    "Ambala": [
      "Ambala",
      "Ambala Cantt"
    ],
    "Karnal": [
      "Karnal",
      "Panipat"
    ],
    "Hisar": [
      "Hisar",
      "Hansi"
    ],
    "Rohtak": [
      "Rohtak",
      "Bhiwani"
    ],
    "Sonipat": [
      "Sonipat",
      "Ganaur"
    ],
    "Panipat": [
      "Panipat",
      "Samalkha"
    ],
    "Bhiwani": [
      "Bhiwani"
    ],
    "Charkhi Dadri": [
      "Charkhi Dadri"
    ],
    "Fatehabad": [
      "Fatehabad"
    ],
    "Jhajjar": [
      "Jhajjar"
    ],
    "Kaithal": [
      "Kaithal"
    ],
    "Kurukshetra": [
      "Kurukshetra"
    ],
    "Mahendragarh": [
      "Mahendragarh"
    ],
    "Mewat": [
      "Mewat"
    ],
    "Palwal": [
      "Palwal"
    ],
    "Rewari": [
      "Rewari"
    ],
    "Sirsa": [
      "Sirsa"
    ],
    "Yamunanagar": [
      "Yamunanagar"
    ]
  },
  "Himachal Pradesh": {
    "Shimla": [
      "Shimla",
      "Kufri",
      "Mashobra"
    ],
    "Kangra": [
      "Dharamsala",
      "McLeod Ganj",
      "Palampur",
      "Kangra"
    ],
    "Mandi": [
      "Mandi",
      "Sundernagar"
    ],
    "Solan": [
      "Solan",
      "Baddi",
      "Nalagarh"
    ],
    "Kullu": [
      "Kullu",
      "Manali"
    ],
    "Bilaspur": [
      "Bilaspur"
    ],
    "Chamba": [
      "Chamba"
    ],
    "Hamirpur": [
      "Hamirpur"
    ],
    "Kinnaur": [
      "Kinnaur"
    ],
    "Lahaul Spiti": [
      "Lahaul Spiti"
    ],
    "Sirmaur": [
      "Sirmaur"
    ]
  },
  "Jharkhand": {
    "Ranchi": [
      "Ranchi",
      "Namkum",
      "Kanke"
    ],
    "Jamshedpur": [
      "Jamshedpur",
      "Gamharia",
      "Adityapur"
    ],
    "Dhanbad": [
      "Dhanbad",
      "Jharia"
    ],
    "Bokaro": [
      "Bokaro Steel City"
    ],
    "Hazaribag": [
      "Hazaribag"
    ],
    "Deoghar": [
      "Deoghar"
    ],
    "Chatra": [
      "Chatra"
    ],
    "Dumka": [
      "Dumka"
    ],
    "East Singhbhum": [
      "East Singhbhum"
    ],
    "Garhwa": [
      "Garhwa"
    ],
    "Giridih": [
      "Giridih"
    ],
    "Godda": [
      "Godda"
    ],
    "Gumla": [
      "Gumla"
    ],
    "Hazaribagh": [
      "Hazaribagh"
    ],
    "Jamtara": [
      "Jamtara"
    ],
    "Khunti": [
      "Khunti"
    ],
    "Koderma": [
      "Koderma"
    ],
    "Latehar": [
      "Latehar"
    ],
    "Lohardaga": [
      "Lohardaga"
    ],
    "Pakur": [
      "Pakur"
    ],
    "Palamu": [
      "Palamu"
    ],
    "Ramgarh": [
      "Ramgarh"
    ],
    "Sahebganj": [
      "Sahebganj"
    ],
    "Seraikela Kharsawan": [
      "Seraikela Kharsawan"
    ],
    "Simdega": [
      "Simdega"
    ],
    "West Singhbhum": [
      "West Singhbhum"
    ]
  },
  "Karnataka": {
    "Bangalore Urban": [
      "Bangalore",
      "Whitefield",
      "Electronic City",
      "HSR Layout",
      "Koramangala",
      "Indiranagar",
      "BTM Layout",
      "Marathahalli",
      "JP Nagar",
      "Yelahanka",
      "Hebbal"
    ],
    "Bangalore Rural": [
      "Devanahalli",
      "Nelamangala",
      "Doddaballapur"
    ],
    "Mysuru": [
      "Mysuru",
      "Nanjangud",
      "T Narsipur"
    ],
    "Mangalore": [
      "Mangalore",
      "Udupi",
      "Manipal"
    ],
    "Hubli-Dharwad": [
      "Hubli",
      "Dharwad"
    ],
    "Belgaum": [
      "Belgaum",
      "Gokak"
    ],
    "Gulbarga": [
      "Gulbarga",
      "Yadgir"
    ],
    "Davangere": [
      "Davangere"
    ],
    "Bellary": [
      "Bellary",
      "Hospet"
    ],
    "Tumkur": [
      "Tumkur"
    ],
    "Shimoga": [
      "Shimoga"
    ],
    "Hassan": [
      "Hassan"
    ],
    "Bagalkot": [
      "Bagalkot"
    ],
    "Bidar": [
      "Bidar"
    ],
    "Chamarajanagar": [
      "Chamarajanagar"
    ],
    "Chikkaballapur": [
      "Chikkaballapur"
    ],
    "Chikkamagaluru": [
      "Chikkamagaluru"
    ],
    "Chitradurga": [
      "Chitradurga"
    ],
    "Dakshina Kannada": [
      "Dakshina Kannada"
    ],
    "Davanagere": [
      "Davanagere"
    ],
    "Dharwad": [
      "Dharwad"
    ],
    "Gadag": [
      "Gadag"
    ],
    "Haveri": [
      "Haveri"
    ],
    "Kodagu": [
      "Kodagu"
    ],
    "Kolar": [
      "Kolar"
    ],
    "Koppal": [
      "Koppal"
    ],
    "Mandya": [
      "Mandya"
    ],
    "Mysore": [
      "Mysore"
    ],
    "Raichur": [
      "Raichur"
    ],
    "Ramanagara": [
      "Ramanagara"
    ],
    "Udupi": [
      "Udupi"
    ],
    "Uttara Kannada": [
      "Uttara Kannada"
    ],
    "Vijayanagara": [
      "Vijayanagara"
    ],
    "Vijayapura": [
      "Vijayapura"
    ],
    "Yadgir": [
      "Yadgir"
    ]
  },
  "Kerala": {
    "Thiruvananthapuram": [
      "Thiruvananthapuram",
      "Neyyattinkara",
      "Nedumangad",
      "Attingal"
    ],
    "Kochi": [
      "Kochi",
      "Ernakulam",
      "Aluva",
      "Thrippunithura",
      "Kakkanad"
    ],
    "Kozhikode": [
      "Kozhikode",
      "Ramanattukara",
      "Feroke"
    ],
    "Thrissur": [
      "Thrissur",
      "Chalakudy",
      "Guruvayoor"
    ],
    "Kollam": [
      "Kollam",
      "Punalur",
      "Karunagappally"
    ],
    "Kannur": [
      "Kannur",
      "Thalassery",
      "Payyanur"
    ],
    "Palakkad": [
      "Palakkad",
      "Ottapalam",
      "Shoranur"
    ],
    "Malappuram": [
      "Malappuram",
      "Manjeri",
      "Tirur",
      "Perinthalmanna"
    ],
    "Alappuzha": [
      "Alappuzha",
      "Cherthala",
      "Kayamkulam"
    ],
    "Kottayam": [
      "Kottayam",
      "Pala",
      "Changanassery"
    ],
    "Ernakulam": [
      "Ernakulam"
    ],
    "Idukki": [
      "Idukki"
    ],
    "Kasaragod": [
      "Kasaragod"
    ],
    "Pathanamthitta": [
      "Pathanamthitta"
    ],
    "Wayanad": [
      "Wayanad"
    ]
  },
  "Madhya Pradesh": {
    "Bhopal": [
      "Bhopal",
      "Hoshangabad"
    ],
    "Indore": [
      "Indore",
      "Mhow",
      "Dewas"
    ],
    "Jabalpur": [
      "Jabalpur",
      "Katni"
    ],
    "Gwalior": [
      "Gwalior",
      "Morena"
    ],
    "Ujjain": [
      "Ujjain",
      "Ratlam"
    ],
    "Sagar": [
      "Sagar",
      "Damoh"
    ],
    "Satna": [
      "Satna",
      "Rewa"
    ],
    "Agar Malwa": [
      "Agar Malwa"
    ],
    "Alirajpur": [
      "Alirajpur"
    ],
    "Anuppur": [
      "Anuppur"
    ],
    "Ashoknagar": [
      "Ashoknagar"
    ],
    "Balaghat": [
      "Balaghat"
    ],
    "Barwani": [
      "Barwani"
    ],
    "Betul": [
      "Betul"
    ],
    "Bhind": [
      "Bhind"
    ],
    "Burhanpur": [
      "Burhanpur"
    ],
    "Chachaura": [
      "Chachaura"
    ],
    "Chhatarpur": [
      "Chhatarpur"
    ],
    "Chhindwara": [
      "Chhindwara"
    ],
    "Damoh": [
      "Damoh"
    ],
    "Datia": [
      "Datia"
    ],
    "Dhar": [
      "Dhar"
    ],
    "Dindori": [
      "Dindori"
    ],
    "Guna": [
      "Guna"
    ],
    "Harda": [
      "Harda"
    ],
    "Hoshangabad": [
      "Hoshangabad"
    ],
    "Jhabua": [
      "Jhabua"
    ],
    "Katni": [
      "Katni"
    ],
    "Khandwa": [
      "Khandwa"
    ],
    "Khargone": [
      "Khargone"
    ],
    "Maihar": [
      "Maihar"
    ],
    "Mandla": [
      "Mandla"
    ],
    "Mandsaur": [
      "Mandsaur"
    ],
    "Morena": [
      "Morena"
    ],
    "Nagda": [
      "Nagda"
    ],
    "Narsinghpur": [
      "Narsinghpur"
    ],
    "Neemuch": [
      "Neemuch"
    ],
    "Niwari": [
      "Niwari"
    ],
    "Panna": [
      "Panna"
    ],
    "Raisen": [
      "Raisen"
    ],
    "Rajgarh": [
      "Rajgarh"
    ],
    "Ratlam": [
      "Ratlam"
    ],
    "Rewa": [
      "Rewa"
    ],
    "Sehore": [
      "Sehore"
    ],
    "Seoni": [
      "Seoni"
    ],
    "Shahdol": [
      "Shahdol"
    ],
    "Shajapur": [
      "Shajapur"
    ],
    "Sheopur": [
      "Sheopur"
    ],
    "Shivpuri": [
      "Shivpuri"
    ],
    "Sidhi": [
      "Sidhi"
    ],
    "Singrauli": [
      "Singrauli"
    ],
    "Tikamgarh": [
      "Tikamgarh"
    ],
    "Umaria": [
      "Umaria"
    ],
    "Vidisha": [
      "Vidisha"
    ]
  },
  "Maharashtra": {
    "Mumbai City": [
      "Mumbai",
      "Colaba",
      "Fort",
      "Byculla",
      "Dadar"
    ],
    "Mumbai Suburban": [
      "Andheri",
      "Bandra",
      "Borivali",
      "Malad",
      "Goregaon",
      "Kandivali",
      "Jogeshwari",
      "Powai"
    ],
    "Thane": [
      "Thane",
      "Navi Mumbai",
      "Kalyan",
      "Dombivli",
      "Bhiwandi",
      "Ulhasnagar",
      "Airoli",
      "Vashi"
    ],
    "Pune": [
      "Pune",
      "Hinjewadi",
      "Kothrud",
      "Wakad",
      "Baner",
      "Viman Nagar",
      "Hadapsar",
      "Kharadi",
      "Pimpri-Chinchwad",
      "Aundh"
    ],
    "Nagpur": [
      "Nagpur",
      "Wardha",
      "Chandrapur"
    ],
    "Nashik": [
      "Nashik",
      "Malegaon",
      "Sinnar"
    ],
    "Aurangabad": [
      "Aurangabad",
      "Jalna"
    ],
    "Kolhapur": [
      "Kolhapur",
      "Sangli",
      "Ichalkaranji"
    ],
    "Solapur": [
      "Solapur",
      "Barshi"
    ],
    "Ratnagiri": [
      "Ratnagiri",
      "Chiplun"
    ],
    "Palghar": [
      "Palghar",
      "Vasai-Virar"
    ],
    "Ahmednagar": [
      "Ahmednagar"
    ],
    "Akola": [
      "Akola"
    ],
    "Amravati": [
      "Amravati"
    ],
    "Beed": [
      "Beed"
    ],
    "Bhandara": [
      "Bhandara"
    ],
    "Buldhana": [
      "Buldhana"
    ],
    "Chandrapur": [
      "Chandrapur"
    ],
    "Dhule": [
      "Dhule"
    ],
    "Gadchiroli": [
      "Gadchiroli"
    ],
    "Gondia": [
      "Gondia"
    ],
    "Hingoli": [
      "Hingoli"
    ],
    "Jalgaon": [
      "Jalgaon"
    ],
    "Jalna": [
      "Jalna"
    ],
    "Latur": [
      "Latur"
    ],
    "Nanded": [
      "Nanded"
    ],
    "Nandurbar": [
      "Nandurbar"
    ],
    "Osmanabad": [
      "Osmanabad"
    ],
    "Parbhani": [
      "Parbhani"
    ],
    "Raigad": [
      "Raigad"
    ],
    "Sangli": [
      "Sangli"
    ],
    "Satara": [
      "Satara"
    ],
    "Sindhudurg": [
      "Sindhudurg"
    ],
    "Wardha": [
      "Wardha"
    ],
    "Washim": [
      "Washim"
    ],
    "Yavatmal": [
      "Yavatmal"
    ]
  },
  "Manipur": {
    "Imphal West": [
      "Imphal"
    ],
    "Imphal East": [
      "Porompat"
    ],
    "Bishnupur": [
      "Bishnupur"
    ],
    "Chandel": [
      "Chandel"
    ],
    "Churachandpur": [
      "Churachandpur"
    ],
    "Jiribam": [
      "Jiribam"
    ],
    "Kakching": [
      "Kakching"
    ],
    "Kamjong": [
      "Kamjong"
    ],
    "Kangpokpi": [
      "Kangpokpi"
    ],
    "Noney": [
      "Noney"
    ],
    "Pherzawl": [
      "Pherzawl"
    ],
    "Senapati": [
      "Senapati"
    ],
    "Tamenglong": [
      "Tamenglong"
    ],
    "Tengnoupal": [
      "Tengnoupal"
    ],
    "Thoubal": [
      "Thoubal"
    ],
    "Ukhrul": [
      "Ukhrul"
    ]
  },
  "Meghalaya": {
    "East Khasi Hills": [
      "Shillong",
      "Nongpoh"
    ],
    "Ri Bhoi": [
      "Nongpoh"
    ],
    "East Garo Hills": [
      "East Garo Hills"
    ],
    "East Jaintia Hills": [
      "East Jaintia Hills"
    ],
    "North Garo Hills": [
      "North Garo Hills"
    ],
    "South Garo Hills": [
      "South Garo Hills"
    ],
    "South West Garo Hills": [
      "South West Garo Hills"
    ],
    "South West Khasi Hills": [
      "South West Khasi Hills"
    ],
    "West Garo Hills": [
      "West Garo Hills"
    ],
    "West Jaintia Hills": [
      "West Jaintia Hills"
    ],
    "West Khasi Hills": [
      "West Khasi Hills"
    ]
  },
  "Mizoram": {
    "Aizawl": [
      "Aizawl"
    ],
    "Lunglei": [
      "Lunglei"
    ],
    "Champhai": [
      "Champhai"
    ],
    "Hnahthial": [
      "Hnahthial"
    ],
    "Kolasib": [
      "Kolasib"
    ],
    "Khawzawl": [
      "Khawzawl"
    ],
    "Lawngtlai": [
      "Lawngtlai"
    ],
    "Mamit": [
      "Mamit"
    ],
    "Saiha": [
      "Saiha"
    ],
    "Serchhip": [
      "Serchhip"
    ],
    "Saitual": [
      "Saitual"
    ]
  },
  "Nagaland": {
    "Kohima": [
      "Kohima"
    ],
    "Dimapur": [
      "Dimapur"
    ],
    "Kiphire": [
      "Kiphire"
    ],
    "Longleng": [
      "Longleng"
    ],
    "Mokokchung": [
      "Mokokchung"
    ],
    "Mon": [
      "Mon"
    ],
    "Noklak": [
      "Noklak"
    ],
    "Peren": [
      "Peren"
    ],
    "Phek": [
      "Phek"
    ],
    "Tuensang": [
      "Tuensang"
    ],
    "Wokha": [
      "Wokha"
    ],
    "Zunheboto": [
      "Zunheboto"
    ]
  },
  "Odisha": {
    "Khordha": [
      "Bhubaneswar",
      "Jatni"
    ],
    "Cuttack": [
      "Cuttack",
      "Choudwar"
    ],
    "Ganjam": [
      "Berhampur",
      "Gopalpur"
    ],
    "Sambalpur": [
      "Sambalpur",
      "Burla"
    ],
    "Puri": [
      "Puri",
      "Konark"
    ],
    "Balasore": [
      "Balasore",
      "Jaleswar"
    ],
    "Mayurbhanj": [
      "Baripada"
    ],
    "Angul": [
      "Angul"
    ],
    "Balangir": [
      "Balangir"
    ],
    "Bargarh": [
      "Bargarh"
    ],
    "Bhadrak": [
      "Bhadrak"
    ],
    "Boudh": [
      "Boudh"
    ],
    "Debagarh": [
      "Debagarh"
    ],
    "Dhenkanal": [
      "Dhenkanal"
    ],
    "Gajapati": [
      "Gajapati"
    ],
    "Jagatsinghpur": [
      "Jagatsinghpur"
    ],
    "Jajpur": [
      "Jajpur"
    ],
    "Jharsuguda": [
      "Jharsuguda"
    ],
    "Kalahandi": [
      "Kalahandi"
    ],
    "Kandhamal": [
      "Kandhamal"
    ],
    "Kendrapara": [
      "Kendrapara"
    ],
    "Kendujhar": [
      "Kendujhar"
    ],
    "Koraput": [
      "Koraput"
    ],
    "Malkangiri": [
      "Malkangiri"
    ],
    "Nabarangpur": [
      "Nabarangpur"
    ],
    "Nayagarh": [
      "Nayagarh"
    ],
    "Nuapada": [
      "Nuapada"
    ],
    "Rayagada": [
      "Rayagada"
    ],
    "Subarnapur": [
      "Subarnapur"
    ],
    "Sundergarh": [
      "Sundergarh"
    ]
  },
  "Punjab": {
    "Ludhiana": [
      "Ludhiana",
      "Khanna",
      "Jagraon"
    ],
    "Amritsar": [
      "Amritsar",
      "Ajnala"
    ],
    "Jalandhar": [
      "Jalandhar",
      "Phagwara",
      "Nakodar"
    ],
    "Patiala": [
      "Patiala",
      "Rajpura"
    ],
    "Mohali": [
      "Mohali",
      "Kharar",
      "Zirakpur",
      "Derabassi"
    ],
    "Bathinda": [
      "Bathinda",
      "Rampura Phul"
    ],
    "Pathankot": [
      "Pathankot"
    ],
    "Sangrur": [
      "Sangrur",
      "Malerkotla"
    ],
    "Barnala": [
      "Barnala"
    ],
    "Faridkot": [
      "Faridkot"
    ],
    "Fatehgarh Sahib": [
      "Fatehgarh Sahib"
    ],
    "Fazilka": [
      "Fazilka"
    ],
    "Firozpur": [
      "Firozpur"
    ],
    "Gurdaspur": [
      "Gurdaspur"
    ],
    "Hoshiarpur": [
      "Hoshiarpur"
    ],
    "Kapurthala": [
      "Kapurthala"
    ],
    "Mansa": [
      "Mansa"
    ],
    "Moga": [
      "Moga"
    ],
    "Muktsar": [
      "Muktsar"
    ],
    "Rupnagar": [
      "Rupnagar"
    ],
    "Shaheed Bhagat Singh Nagar": [
      "Shaheed Bhagat Singh Nagar"
    ],
    "Tarn Taran": [
      "Tarn Taran"
    ]
  },
  "Rajasthan": {
    "Jaipur": [
      "Jaipur",
      "Sanganer",
      "Amer",
      "Chomu",
      "Mansarovar"
    ],
    "Jodhpur": [
      "Jodhpur",
      "Phalodi"
    ],
    "Udaipur": [
      "Udaipur",
      "Rajsamand"
    ],
    "Kota": [
      "Kota",
      "Bundi",
      "Jhalawar"
    ],
    "Ajmer": [
      "Ajmer",
      "Pushkar",
      "Kishangarh"
    ],
    "Bikaner": [
      "Bikaner",
      "Nokha"
    ],
    "Alwar": [
      "Alwar",
      "Bhiwadi",
      "Neemrana"
    ],
    "Sikar": [
      "Sikar",
      "Lachhmangarh"
    ],
    "Bharatpur": [
      "Bharatpur",
      "Deeg"
    ],
    "Banswara": [
      "Banswara"
    ],
    "Baran": [
      "Baran"
    ],
    "Barmer": [
      "Barmer"
    ],
    "Bhilwara": [
      "Bhilwara"
    ],
    "Bundi": [
      "Bundi"
    ],
    "Chittorgarh": [
      "Chittorgarh"
    ],
    "Churu": [
      "Churu"
    ],
    "Dausa": [
      "Dausa"
    ],
    "Dholpur": [
      "Dholpur"
    ],
    "Dungarpur": [
      "Dungarpur"
    ],
    "Hanumangarh": [
      "Hanumangarh"
    ],
    "Jaisalmer": [
      "Jaisalmer"
    ],
    "Jalore": [
      "Jalore"
    ],
    "Jhalawar": [
      "Jhalawar"
    ],
    "Jhunjhunu": [
      "Jhunjhunu"
    ],
    "Karauli": [
      "Karauli"
    ],
    "Nagaur": [
      "Nagaur"
    ],
    "Pratapgarh": [
      "Pratapgarh"
    ],
    "Rajsamand": [
      "Rajsamand"
    ],
    "Sawai Madhopur": [
      "Sawai Madhopur"
    ],
    "Sirohi": [
      "Sirohi"
    ],
    "Sri Ganganagar": [
      "Sri Ganganagar"
    ],
    "Tonk": [
      "Tonk"
    ]
  },
  "Sikkim": {
    "East Sikkim": [
      "Gangtok"
    ],
    "South Sikkim": [
      "Namchi"
    ],
    "North Sikkim": [
      "North Sikkim"
    ],
    "West Sikkim": [
      "West Sikkim"
    ]
  },
  "Tamil Nadu": {
    "Chennai": [
      "Chennai",
      "Guindy",
      "Tambaram",
      "Velachery",
      "Sholinganallur",
      "OMR",
      "Anna Nagar",
      "T Nagar",
      "Adyar",
      "Porur"
    ],
    "Coimbatore": [
      "Coimbatore",
      "Tirupur",
      "Pollachi"
    ],
    "Madurai": [
      "Madurai",
      "Melur"
    ],
    "Tiruchirappalli": [
      "Tiruchirappalli",
      "Srirangam"
    ],
    "Salem": [
      "Salem",
      "Attur"
    ],
    "Erode": [
      "Erode",
      "Gobichettipalayam"
    ],
    "Vellore": [
      "Vellore",
      "Ranipet",
      "Ambur"
    ],
    "Tirunelveli": [
      "Tirunelveli",
      "Nagercoil"
    ],
    "Thanjavur": [
      "Thanjavur",
      "Kumbakonam"
    ],
    "Kancheepuram": [
      "Kancheepuram",
      "Sriperumbudur",
      "Chengalpattu"
    ],
    "Ariyalur": [
      "Ariyalur"
    ],
    "Chengalpattu": [
      "Chengalpattu"
    ],
    "Cuddalore": [
      "Cuddalore"
    ],
    "Dharmapuri": [
      "Dharmapuri"
    ],
    "Dindigul": [
      "Dindigul"
    ],
    "Kallakurichi": [
      "Kallakurichi"
    ],
    "Kanchipuram": [
      "Kanchipuram"
    ],
    "Kanyakumari": [
      "Kanyakumari"
    ],
    "Karur": [
      "Karur"
    ],
    "Krishnagiri": [
      "Krishnagiri"
    ],
    "Mayiladuthurai": [
      "Mayiladuthurai"
    ],
    "Nagapattinam": [
      "Nagapattinam"
    ],
    "Namakkal": [
      "Namakkal"
    ],
    "Nilgiris": [
      "Nilgiris"
    ],
    "Perambalur": [
      "Perambalur"
    ],
    "Pudukkottai": [
      "Pudukkottai"
    ],
    "Ramanathapuram": [
      "Ramanathapuram"
    ],
    "Ranipet": [
      "Ranipet"
    ],
    "Sivaganga": [
      "Sivaganga"
    ],
    "Tenkasi": [
      "Tenkasi"
    ],
    "Theni": [
      "Theni"
    ],
    "Thoothukudi": [
      "Thoothukudi"
    ],
    "Tirupattur": [
      "Tirupattur"
    ],
    "Tiruppur": [
      "Tiruppur"
    ],
    "Tiruvallur": [
      "Tiruvallur"
    ],
    "Tiruvannamalai": [
      "Tiruvannamalai"
    ],
    "Tiruvarur": [
      "Tiruvarur"
    ],
    "Viluppuram": [
      "Viluppuram"
    ],
    "Virudhunagar": [
      "Virudhunagar"
    ]
  },
  "Telangana": {
    "Hyderabad": [
      "Hyderabad",
      "Secunderabad",
      "Gachibowli",
      "HITEC City",
      "Madhapur",
      "Kukatpally",
      "Banjara Hills",
      "Jubilee Hills",
      "Ameerpet",
      "Dilsukhnagar",
      "LB Nagar",
      "Miyapur"
    ],
    "Rangareddy": [
      "Shamshabad",
      "Medchal",
      "Kompally",
      "Mahbubnagar"
    ],
    "Warangal": [
      "Warangal",
      "Hanamkonda"
    ],
    "Karimnagar": [
      "Karimnagar",
      "Jagitial"
    ],
    "Nizamabad": [
      "Nizamabad",
      "Bodhan"
    ],
    "Khammam": [
      "Khammam",
      "Kothagudem"
    ],
    "Medak": [
      "Sangareddy",
      "Siddipet"
    ],
    "Adilabad": [
      "Adilabad"
    ],
    "Bhadradri Kothagudem": [
      "Bhadradri Kothagudem"
    ],
    "Jagtial": [
      "Jagtial"
    ],
    "Jangaon": [
      "Jangaon"
    ],
    "Jayashankar": [
      "Jayashankar"
    ],
    "Jogulamba": [
      "Jogulamba"
    ],
    "Kamareddy": [
      "Kamareddy"
    ],
    "Komaram Bheem": [
      "Komaram Bheem"
    ],
    "Mahabubabad": [
      "Mahabubabad"
    ],
    "Mahbubnagar": [
      "Mahbubnagar"
    ],
    "Mancherial": [
      "Mancherial"
    ],
    "Medchal": [
      "Medchal"
    ],
    "Mulugu": [
      "Mulugu"
    ],
    "Nagarkurnool": [
      "Nagarkurnool"
    ],
    "Nalgonda": [
      "Nalgonda"
    ],
    "Narayanpet": [
      "Narayanpet"
    ],
    "Nirmal": [
      "Nirmal"
    ],
    "Peddapalli": [
      "Peddapalli"
    ],
    "Rajanna Sircilla": [
      "Rajanna Sircilla"
    ],
    "Ranga Reddy": [
      "Ranga Reddy"
    ],
    "Sangareddy": [
      "Sangareddy"
    ],
    "Siddipet": [
      "Siddipet"
    ],
    "Suryapet": [
      "Suryapet"
    ],
    "Vikarabad": [
      "Vikarabad"
    ],
    "Wanaparthy": [
      "Wanaparthy"
    ],
    "Warangal Rural": [
      "Warangal Rural"
    ],
    "Warangal Urban": [
      "Warangal Urban"
    ],
    "Yadadri Bhuvanagiri": [
      "Yadadri Bhuvanagiri"
    ]
  },
  "Tripura": {
    "West Tripura": [
      "Agartala"
    ],
    "Gomati": [
      "Udaipur"
    ],
    "Dhalai": [
      "Dhalai"
    ],
    "Khowai": [
      "Khowai"
    ],
    "North Tripura": [
      "North Tripura"
    ],
    "Sepahijala": [
      "Sepahijala"
    ],
    "South Tripura": [
      "South Tripura"
    ],
    "Unakoti": [
      "Unakoti"
    ]
  },
  "Uttar Pradesh": {
    "Lucknow": [
      "Lucknow",
      "Gomti Nagar",
      "Hazratganj",
      "Aliganj",
      "Indira Nagar"
    ],
    "Noida": [
      "Noida",
      "Greater Noida",
      "Noida Extension"
    ],
    "Ghaziabad": [
      "Ghaziabad",
      "Indirapuram",
      "Vaishali",
      "Crossing Republik"
    ],
    "Agra": [
      "Agra",
      "Fatehpur Sikri"
    ],
    "Varanasi": [
      "Varanasi",
      "Lanka",
      "Sigra"
    ],
    "Kanpur": [
      "Kanpur",
      "Kanpur Dehat"
    ],
    "Meerut": [
      "Meerut",
      "Modinagar"
    ],
    "Allahabad": [
      "Prayagraj",
      "Naini"
    ],
    "Aligarh": [
      "Aligarh"
    ],
    "Bareilly": [
      "Bareilly"
    ],
    "Gorakhpur": [
      "Gorakhpur"
    ],
    "Mathura": [
      "Mathura",
      "Vrindavan"
    ],
    "Jhansi": [
      "Jhansi",
      "Orchha"
    ],
    "Ambedkar Nagar": [
      "Ambedkar Nagar"
    ],
    "Amethi": [
      "Amethi"
    ],
    "Amroha": [
      "Amroha"
    ],
    "Auraiya": [
      "Auraiya"
    ],
    "Ayodhya": [
      "Ayodhya"
    ],
    "Azamgarh": [
      "Azamgarh"
    ],
    "Baghpat": [
      "Baghpat"
    ],
    "Bahraich": [
      "Bahraich"
    ],
    "Ballia": [
      "Ballia"
    ],
    "Balrampur": [
      "Balrampur"
    ],
    "Banda": [
      "Banda"
    ],
    "Barabanki": [
      "Barabanki"
    ],
    "Basti": [
      "Basti"
    ],
    "Bhadohi": [
      "Bhadohi"
    ],
    "Bijnor": [
      "Bijnor"
    ],
    "Budaun": [
      "Budaun"
    ],
    "Bulandshahr": [
      "Bulandshahr"
    ],
    "Chandauli": [
      "Chandauli"
    ],
    "Chitrakoot": [
      "Chitrakoot"
    ],
    "Deoria": [
      "Deoria"
    ],
    "Etah": [
      "Etah"
    ],
    "Etawah": [
      "Etawah"
    ],
    "Farrukhabad": [
      "Farrukhabad"
    ],
    "Fatehpur": [
      "Fatehpur"
    ],
    "Firozabad": [
      "Firozabad"
    ],
    "Gautam Buddha Nagar": [
      "Gautam Buddha Nagar"
    ],
    "Ghazipur": [
      "Ghazipur"
    ],
    "Gonda": [
      "Gonda"
    ],
    "Hamirpur": [
      "Hamirpur"
    ],
    "Hapur": [
      "Hapur"
    ],
    "Hardoi": [
      "Hardoi"
    ],
    "Hathras": [
      "Hathras"
    ],
    "Jalaun": [
      "Jalaun"
    ],
    "Jaunpur": [
      "Jaunpur"
    ],
    "Kannauj": [
      "Kannauj"
    ],
    "Kanpur Dehat": [
      "Kanpur Dehat"
    ],
    "Kanpur Nagar": [
      "Kanpur Nagar"
    ],
    "Kasganj": [
      "Kasganj"
    ],
    "Kaushambi": [
      "Kaushambi"
    ],
    "Kheri": [
      "Kheri"
    ],
    "Kushinagar": [
      "Kushinagar"
    ],
    "Lalitpur": [
      "Lalitpur"
    ],
    "Maharajganj": [
      "Maharajganj"
    ],
    "Mahoba": [
      "Mahoba"
    ],
    "Mainpuri": [
      "Mainpuri"
    ],
    "Mau": [
      "Mau"
    ],
    "Mirzapur": [
      "Mirzapur"
    ],
    "Moradabad": [
      "Moradabad"
    ],
    "Muzaffarnagar": [
      "Muzaffarnagar"
    ],
    "Pilibhit": [
      "Pilibhit"
    ],
    "Pratapgarh": [
      "Pratapgarh"
    ],
    "Prayagraj": [
      "Prayagraj"
    ],
    "Raebareli": [
      "Raebareli"
    ],
    "Rampur": [
      "Rampur"
    ],
    "Saharanpur": [
      "Saharanpur"
    ],
    "Sambhal": [
      "Sambhal"
    ],
    "Sant Kabir Nagar": [
      "Sant Kabir Nagar"
    ],
    "Shahjahanpur": [
      "Shahjahanpur"
    ],
    "Shamli": [
      "Shamli"
    ],
    "Shravasti": [
      "Shravasti"
    ],
    "Siddharthnagar": [
      "Siddharthnagar"
    ],
    "Sitapur": [
      "Sitapur"
    ],
    "Sonbhadra": [
      "Sonbhadra"
    ],
    "Sultanpur": [
      "Sultanpur"
    ],
    "Unnao": [
      "Unnao"
    ]
  },
  "Uttarakhand": {
    "Dehradun": [
      "Dehradun",
      "Mussoorie",
      "Rishikesh"
    ],
    "Haridwar": [
      "Haridwar",
      "Roorkee"
    ],
    "Nainital": [
      "Haldwani",
      "Nainital"
    ],
    "Udham Singh Nagar": [
      "Rudrapur",
      "Kashipur",
      "Haldwani"
    ],
    "Almora": [
      "Almora"
    ],
    "Bageshwar": [
      "Bageshwar"
    ],
    "Chamoli": [
      "Chamoli"
    ],
    "Champawat": [
      "Champawat"
    ],
    "Pauri": [
      "Pauri"
    ],
    "Pithoragarh": [
      "Pithoragarh"
    ],
    "Rudraprayag": [
      "Rudraprayag"
    ],
    "Tehri": [
      "Tehri"
    ],
    "Uttarkashi": [
      "Uttarkashi"
    ]
  },
  "West Bengal": {
    "Kolkata": [
      "Kolkata",
      "Salt Lake",
      "New Town",
      "Howrah",
      "Jadavpur",
      "Park Street",
      "Esplanade"
    ],
    "North 24 Parganas": [
      "Barasat",
      "Barrackpore",
      "Dum Dum",
      "Khardah"
    ],
    "South 24 Parganas": [
      "Baruipur",
      "Diamond Harbour"
    ],
    "Howrah": [
      "Howrah",
      "Shibpur",
      "Uluberia"
    ],
    "Hooghly": [
      "Chinsurah",
      "Serampore",
      "Dankuni"
    ],
    "Burdwan": [
      "Burdwan",
      "Asansol",
      "Durgapur"
    ],
    "Nadia": [
      "Krishnanagar",
      "Kalyani",
      "Ranaghat"
    ],
    "Siliguri": [
      "Siliguri",
      "Jalpaiguri"
    ],
    "Alipurduar": [
      "Alipurduar"
    ],
    "Bankura": [
      "Bankura"
    ],
    "Birbhum": [
      "Birbhum"
    ],
    "Cooch Behar": [
      "Cooch Behar"
    ],
    "Dakshin Dinajpur": [
      "Dakshin Dinajpur"
    ],
    "Darjeeling": [
      "Darjeeling"
    ],
    "Jalpaiguri": [
      "Jalpaiguri"
    ],
    "Jhargram": [
      "Jhargram"
    ],
    "Kalimpong": [
      "Kalimpong"
    ],
    "Malda": [
      "Malda"
    ],
    "Murshidabad": [
      "Murshidabad"
    ],
    "Paschim Bardhaman": [
      "Paschim Bardhaman"
    ],
    "Paschim Medinipur": [
      "Paschim Medinipur"
    ],
    "Purba Bardhaman": [
      "Purba Bardhaman"
    ],
    "Purba Medinipur": [
      "Purba Medinipur"
    ],
    "Purulia": [
      "Purulia"
    ],
    "Uttar Dinajpur": [
      "Uttar Dinajpur"
    ]
  },
  "Chandigarh": {
    "Chandigarh": [
      "Chandigarh",
      "Sector 17",
      "Sector 22",
      "Sector 34",
      "Sector 43"
    ]
  },
  "Puducherry": {
    "Puducherry": [
      "Puducherry",
      "Oulgaret"
    ],
    "Karaikal": [
      "Karaikal"
    ],
    "Mahe": [
      "Mahe"
    ],
    "Yanam": [
      "Yanam"
    ]
  },
  "Jammu & Kashmir": {
    "Srinagar": [
      "Srinagar",
      "Lal Chowk",
      "Rajbagh"
    ],
    "Jammu": [
      "Jammu",
      "Katra"
    ],
    "Anantnag": [
      "Anantnag"
    ],
    "Baramulla": [
      "Baramulla",
      "Sopore"
    ],
    "Bandipora": [
      "Bandipora"
    ],
    "Budgam": [
      "Budgam"
    ],
    "Doda": [
      "Doda"
    ],
    "Ganderbal": [
      "Ganderbal"
    ],
    "Kathua": [
      "Kathua"
    ],
    "Kishtwar": [
      "Kishtwar"
    ],
    "Kulgam": [
      "Kulgam"
    ],
    "Kupwara": [
      "Kupwara"
    ],
    "Poonch": [
      "Poonch"
    ],
    "Pulwama": [
      "Pulwama"
    ],
    "Rajouri": [
      "Rajouri"
    ],
    "Ramban": [
      "Ramban"
    ],
    "Reasi": [
      "Reasi"
    ],
    "Samba": [
      "Samba"
    ],
    "Shopian": [
      "Shopian"
    ],
    "Udhampur": [
      "Udhampur"
    ]
  },
  "Ladakh": {
    "Leh": [
      "Leh"
    ],
    "Kargil": [
      "Kargil"
    ]
  },
  "Andaman Nicobar": {
    "Nicobar": [
      "Nicobar"
    ],
    "North Middle Andaman": [
      "North Middle Andaman"
    ],
    "South Andaman": [
      "South Andaman"
    ]
  },
  "Dadra Nagar Haveli": {
    "Dadra Nagar Haveli": [
      "Dadra Nagar Haveli"
    ]
  },
  "Daman Diu": {
    "Daman": [
      "Daman"
    ]
  },
  "Lakshadweep": {
    "Lakshadweep": [
      "Lakshadweep"
    ]
  },
  "Madhya": {
    "Pradesh": [
      "Pradesh"
    ]
  }
};

/** Get sorted list of all states */
export function getStates(): string[] {
  return Object.keys(INDIA_LOCATIONS).sort();
}

/** Get sorted districts for a state */
export function getDistricts(state: string): string[] {
  return state && INDIA_LOCATIONS[state]
    ? Object.keys(INDIA_LOCATIONS[state]).sort()
    : [];
}

/** Get sorted cities for a state + district */
export function getCities(state: string, district: string): string[] {
  return state && district && INDIA_LOCATIONS[state]?.[district]
    ? INDIA_LOCATIONS[state][district].sort()
    : [];
}

/**
 * Reverse-lookup: given a city name (e.g. from GPS), find the best matching
 * state and district. Returns { state, district, city } or nulls.
 */
export function findLocationByCity(cityName: string): { state: string; district: string; city: string } | null {
  const search = cityName.toLowerCase().trim();
  for (const state of Object.keys(INDIA_LOCATIONS)) {
    for (const district of Object.keys(INDIA_LOCATIONS[state])) {
      for (const city of INDIA_LOCATIONS[state][district]) {
        if (city.toLowerCase() === search) {
          return { state, district, city };
        }
      }
    }
  }
  // Partial match fallback
  for (const state of Object.keys(INDIA_LOCATIONS)) {
    for (const district of Object.keys(INDIA_LOCATIONS[state])) {
      for (const city of INDIA_LOCATIONS[state][district]) {
        if (city.toLowerCase().includes(search) || search.includes(city.toLowerCase())) {
          return { state, district, city };
        }
      }
    }
  }
  return null;
}
