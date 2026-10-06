// Heritage spots of old Pune. Coordinates are approximate - tweak them if a pin looks off.
// "next" = the id of the spot the guide suggests after this one.
const SPOTS = [
  {
    id: "kasba", next: "lalmahal", lat: 18.5136, lng: 73.8559,
    name: { mr: "कसबा गणपती", en: "Kasba Ganpati" },
    story: {
      mr: "तुम्ही आता कसबा पेठेत आहात. हे पुण्याचे ग्रामदैवत, कसबा गणपती. जिजाबाईंनी शिवाजी महाराजांच्या लहानपणी या मंदिराची स्थापना केली, असे सांगितले जाते. पुण्यातील गणेशोत्सवात सर्वात पहिला मान याच गणपतीला मिळतो. शेंदूर लावलेली ही स्वयंभू मूर्ती पाहा. आता जवळच असलेल्या लाल महालाकडे चला, जिथे बाल शिवाजींनी आपले बालपण घालवले.",
      en: "You are now in Kasba Peth. This is Kasba Ganpati, the gramdaivat, the presiding deity of Pune. It is said that Jijabai established this temple when Shivaji Maharaj was a child. During Ganeshotsav, this Ganpati gets the first honour in Pune's procession. Look at the swayambhu idol covered in sindoor. Next, walk to nearby Lal Mahal, where young Shivaji spent his childhood."
    }
  },
  {
    id: "lalmahal", next: "shaniwarwada", lat: 18.5183, lng: 73.8550,
    name: { mr: "लाल महाल", en: "Lal Mahal" },
    story: {
      mr: "हा लाल महाल. शहाजीराजांनी १६३० साली हा महाल बांधला, शिवाजी महाराज आणि जिजाऊ येथे राहत असत. इथेच १६६३ साली शाहिस्तेखानावर महाराजांनी धाडसी हल्ला केला आणि त्याची बोटे कापली, अशी कथा आहे. आता शनिवारवाड्याकडे चला, पेशव्यांच्या वैभवाची साक्ष.",
      en: "This is Lal Mahal. Shahaji Raje built it in 1630, and Shivaji Maharaj and Jijau lived here. In 1663, Shivaji Maharaj made his daring raid on Shaista Khan here and cut off his fingers. Now walk on to Shaniwar Wada, the proof of the Peshwas' glory."
    }
  },
  {
    id: "shaniwarwada", next: "dagdusheth", lat: 18.5195, lng: 73.8553,
    name: { mr: "शनिवारवाडा", en: "Shaniwar Wada" },
    story: {
      mr: "शनिवारवाडा, पेशव्यांचे सत्ताकेंद्र. पहिले बाजीराव पेशवे यांनी १७३२ साली याचा पाया घातला, शनिवारी भूमिपूजन झाले म्हणून नाव शनिवारवाडा. १८२८ साली लागलेल्या भीषण आगीत याचा बराचसा भाग नष्ट झाला. आजही दिल्ली दरवाजा आणि भव्य तटबंदी इतिहासाची गोष्ट सांगते. पुढचा थांबा, दगडूशेठ हलवाई गणपती.",
      en: "Shaniwar Wada, the seat of the Peshwas. Peshwa Bajirao I laid its foundation in 1732, and since the ground-breaking was on a Saturday, it is called Shaniwar Wada. A terrible fire in 1828 destroyed most of it. Even today the Delhi Darwaza and the massive fort walls tell the story of history. Next stop, Dagdusheth Halwai Ganpati."
    }
  },
  {
    id: "dagdusheth", next: "tulshibaug", lat: 18.5164, lng: 73.8561,
    name: { mr: "दगडूशेठ हलवाई गणपती", en: "Dagdusheth Halwai Ganpati" },
    story: {
      mr: "हे दगडूशेठ हलवाई गणपती मंदिर. दगडूशेठ हलवाई या मिठाई व्यापाऱ्याने प्लेगमध्ये आपला मुलगा गमावल्यानंतर गणपतीची स्थापना केली. १८९३ पासून येथे सार्वजनिक गणेशोत्सव साजरा होतो. आता तुळशीबागेच्या गजबजलेल्या गल्लीकडे चला.",
      en: "This is the Dagdusheth Halwai Ganpati temple. Dagdusheth Halwai, a sweet merchant, installed this Ganpati after losing his son to the plague. Since 1893 the public Ganeshotsav has been celebrated here. Now head to the busy lanes of Tulshibaug."
    }
  },
  {
    id: "tulshibaug", next: "vishrambaug", lat: 18.5121, lng: 73.8556,
    name: { mr: "तुळशीबाग", en: "Tulshibaug" },
    story: {
      mr: "तुळशीबाग, राम मंदिर आणि बाजारपेठ यांचा सुंदर संगम. पेशवेकाळात नारो अप्पाजी खिरे यांनी हे राम मंदिर बांधले. आजूबाजूच्या बाजारात बांगड्या, भांडी आणि पुणेरी खरेदीची मजा घ्या. पुढे विश्रामबाग वाडा पाहायला जाऊया.",
      en: "Tulshibaug, a lovely blend of a Ram temple and a market. In the Peshwa era, Naro Appaji Khire built this Ram temple. Enjoy the bangles, utensils and Punekar shopping in the market around it. Next, let's see Vishrambaug Wada."
    }
  },
  {
    id: "vishrambaug", next: "kelkar", lat: 18.5143, lng: 73.8537,
    name: { mr: "विश्रामबाग वाडा", en: "Vishrambaug Wada" },
    story: {
      mr: "विश्रामबाग वाडा, दुसरे बाजीराव पेशवे यांनी बांधलेला भव्य वाडा. त्याचे लाकडी कोरीवकाम आणि नक्षीदार कमानी पाहण्यासारख्या आहेत. हा पेशवेकालीन स्थापत्याचा उत्तम नमुना आहे. पुढे, राजा दिनकर केळकर संग्रहालय.",
      en: "Vishrambaug Wada, a grand mansion built by Peshwa Bajirao II. Its carved woodwork and ornate arches are worth admiring. It is a fine example of Peshwa-era architecture. Next, the Raja Dinkar Kelkar Museum."
    }
  },
  {
    id: "kelkar", next: "parvati", lat: 18.5115, lng: 73.8531,
    name: { mr: "राजा दिनकर केळकर संग्रहालय", en: "Raja Dinkar Kelkar Museum" },
    story: {
      mr: "हे राजा दिनकर केळकर संग्रहालय. डॉ. दिनकर केळकर यांनी आपल्या मुलाच्या स्मरणार्थ जमवलेल्या सुमारे वीस हजार वस्तू येथे आहेत. दिवे, वाद्ये, पेशवेकालीन वस्तू आणि सुंदर लाकडी कोरीवकाम इथे पाहायला मिळते. शेवटचा थांबा, पर्वती टेकडी.",
      en: "This is the Raja Dinkar Kelkar Museum. Dr. Dinkar Kelkar collected about twenty thousand objects in memory of his son, and they are displayed here. You will find lamps, musical instruments, Peshwa-era items and beautiful woodwork. The final stop, Parvati Hill."
    }
  },
  {
    id: "parvati", next: "pataleshwar", lat: 18.4970, lng: 73.8444,
    name: { mr: "पर्वती", en: "Parvati Hill" },
    story: {
      mr: "पर्वती टेकडी. नानासाहेब पेशवे यांनी १७४९ साली येथे देवदेवेश्वर मंदिर बांधले. १०८ पायऱ्या चढून वर गेल्यावर संपूर्ण जुने पुणे नजरेस पडते. येथून सूर्यास्त पाहणे हा वेगळाच अनुभव असतो.",
      en: "Parvati Hill. Nanasaheb Peshwa built the Devdeveshwar temple here in 1749. After climbing the 108 steps, the whole of old Pune opens up before your eyes. Watching the sunset from here is a special experience."
    }
  },
  {
    id: "pataleshwar", next: "kasba", lat: 18.5287, lng: 73.8490,
    name: { mr: "पाताळेश्वर लेणी", en: "Pataleshwar Cave" },
    story: {
      mr: "पाताळेश्वर लेणी, जंगली महाराज रस्त्यावर. आठव्या शतकातील ही एकाच खडकात कोरलेली लेणी राष्ट्रकूट काळातील मानली जाते. मध्यभागी गोलाकार नंदी मंडप आणि आत शिवलिंग आहे. शहराच्या गर्दीत असूनही येथे शांतता जाणवते.",
      en: "Pataleshwar Cave, on Jangali Maharaj Road. This rock-cut cave from the 8th century is believed to be from the Rashtrakuta period. It has a round Nandi mandap in the centre and a Shivling inside. Despite being in the middle of the city, you feel peace here."
    }
  },
  {
    id: "agakhan", next: "kasba", lat: 18.5524, lng: 73.9019,
    name: { mr: "आगाखान पॅलेस", en: "Aga Khan Palace" },
    story: {
      mr: "आगाखान पॅलेस. सुलतान मुहम्मद शाह आगाखान तिसरे यांनी १८९२ साली हा राजवाडा बांधला. १९४२ च्या चले जाव चळवळीनंतर महात्मा गांधी, कस्तुरबा आणि महादेवभाई देसाई यांना येथे स्थानबद्ध केले होते. कस्तुरबा आणि महादेवभाई यांचे येथेच निधन झाले. त्यांची समाधी आजही येथे आहे.",
      en: "Aga Khan Palace. Sultan Muhammad Shah Aga Khan III built this palace in 1892. After the Quit India movement of 1942, Mahatma Gandhi, Kasturba and Mahadev Desai were held here. Kasturba and Mahadev Desai passed away here, and their samadhis are still here today."
    }
  }
];
