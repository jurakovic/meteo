# Upute

**Meteo radari** na jednom mjestu prikazuje radarske i satelitske karte, munje, prognoze nevremena i sinoptičke karte iz više izvora, bez otvaranja desetak stranica.

Stranica ima dva dijela:

- **Početna** — stalan popis karata. Ništa se ne podešava, uvijek je isto i odmah se otvori.
- **Prilagodi** — isti prikaz, ali sami birate koje se karte vide, kojim redoslijedom i, na računalu, kako su razmještene po ekranu. Do nje se dolazi gumbom *Prilagodi* na početnoj stranici.

Sve osim poglavlja [Osnovno korištenje](#osnovno-korištenje) odnosi se na stranicu *Prilagodi*.

Dio mogućnosti — izdvojeni prozori, bočni stupci, nadzorna ploča, mreža i tipkovnički prečaci — radi samo na računalu, odnosno na ekranu širem od 800 px s mišem. Na dodirnim ekranima stranica ostaje obična, okomita lista karata. Vidi [Na mobitelu](#na-mobitelu).

## Osnovno korištenje

Svaka karta ima naslovnu traku s imenom izvora. Ime je ujedno i poveznica na izvornu stranicu.

**Karte s više slika** (npr. *Neverin | Radar | Hrvatska*) imaju strelice `❮` i `❯` na rubovima i niz kvadratića ispod slike koji pokazuje na kojoj ste slici. Na dodirnom ekranu se mijenjaju i prelaskom prsta preko slike.

**Interaktivne karte** (Windy, Blitzortung, meteoblue i slične) u početku ne primaju miš — preko njih stoji prozirni sloj s natpisom *Dvostruki klik za pristup interaktivnoj karti*. To je namjerno: bez toga bi se karta pomicala dok se stranica lista. Dvostrukim klikom sloj nestaje i karta se dalje koristi normalno. Tada se u traci pojavljuju još dva gumba:

| Gumb | Značenje |
|---|---|
| `[HR]` / `[EU]` | prebacuje između prikaza Hrvatske i Europe |
| `[X]` | vraća kartu na početni položaj i zumiranje |
| `[ ]` | otvara kartu preko cijelog zaslona |

**Linkovi.** Gumb *Linkovi* vodi na popis dodatnih izvora na dnu stranice. Kvadratić pokraj njega uključuje prikaz linkova ispod svake karte.

**Upute.** Gumb `?` u redu gumba otvara ovaj tekst, kao i poveznica *Upute* u podnožju i tipka <kbd>H</kbd>. Otvara se u prozoru preko stranice, pa se upute čitaju uz karte, a ne umjesto njih; zatvara se natpisom *Zatvori* ili tipkom <kbd>Esc</kbd>. Poveznica koja završava s `#upute` otvara ih odmah pri otvaranju stranice.

## Automatsko osvježavanje

Slike zastare na stranici koja je dugo otvorena. U dijalogu *Karte* je red **Osvježavaj svakih** s kvadratićem i razmakom — 5, 10, 15, 30 ili 60 minuta. Isključeno je dok se ne uključi, a početni razmak je 5 minuta.

Osvježavaju se slike, nizovi slika, videa i jednostavne karte — sve ono što ima gumb `[R]`. Interaktivne karte (Windy, Blitzortung i slične) se preskaču: one same dohvaćaju najnovije podatke, a ponovno učitavanje bi im samo poništilo pomak i zumiranje.

**Odbrojavanje.** Dok je osvježavanje uključeno, na vrhu ekrana visi pločica s vremenom do sljedećeg osvježavanja. Tu je i gumb `[R]` koji osvježava odmah. Vrijeme se vraća na puni razmak pri svakom osvježavanju svih karata — automatskom, ručnom (`[R]` na pločici ili tipka <kbd>R</kbd>) i pri ponovnom otvaranju stranice. `[R]` na pojedinoj karti osvježi samo nju i ne dira odbrojavanje, osim ako je to jedina karta koja se osvježava.

Kao i prekidači mreže, ova postavka **ne putuje** u predlošku ni u poveznici — vrijedi samo u ovom pregledniku.

## Odabir karata

Gumb **Karte** otvara dijalog u kojem se bira što se prikazuje. Dok je otvoren, stranica iza njega se vidi ali se ne dira — malo je zatamnjena, ne lista se i ništa se na njoj ne može kliknuti. Klik bilo gdje izvan dijaloga samo ga zatvara i odbacuje što je u njemu mijenjano; taj klik ne ide dalje, pa neće usput otvoriti poveznicu ni pomaknuti prozor. Zatvara ga i tipka <kbd>Esc</kbd>.

Dijalog ima dva popisa:

- **Gornji popis** je redoslijed prikaza. Karte se povlače za znak `≡` i time se mijenja poredak na stranici.
- **Donji popis** su sve dostupne karte. Služi samo za pronalaženje — kvadratić pokraj karte dodaje je na kraj gornjeg popisa.

Ispred svakog imena stoji znak vrste karte: 📡 radar, 🛰️ satelit, ⚡ munje, 🌡️ temperatura, ⛈️ nevrijeme, 🗺️ sinoptika, 📷 kamera, 📈 prognoza.

Donji popis se može poredati po *Zadano*, *Naziv* ili *Vrsta*; ponovni klik na isti okreće smjer. To ne mijenja redoslijed prikaza, samo pomaže u traženju.

Ispod reda za poredak je **okvir za traženje**. Upisano se traži i po imenu i po vrsti karte, pa *munje* izdvoji sve munje kao što *neverin* izdvoji sve karte tog izvora. Više riječi sužava popis — *neverin radar* nađe oba Neverinova radara, *neverin radar hrvatska* samo jedan. Kvačice i naša slova nisu obavezni: *chmu* nalazi *ČHMÚ*, *sinopticka* nalazi *Sinoptička*.

Traženje se tiče samo donjeg popisa — gornji je redoslijed prikaza i u njemu se karte povlače, što se ne bi moglo kad bi neke bile sakrivene. Upisani pojam ostaje i nakon odabira karte ili drugog predloška; briše se znakom `×` u okviru ili tipkom <kbd>Esc</kbd>, koja praznim okvirom zatvara dijalog.

Ništa se ne primjenjuje dok se ne pritisne **Primijeni** ili tipka <kbd>Enter</kbd>. Zatvaranje dijaloga bez toga poništava promjene.

> Ako se dijalog zatvori a stranica ostane prazna, na njoj piše *Nema odabranih karata*. To znači da je popis prazan — otvorite *Karte* i odaberite barem jednu.

## Predlošci

Na vrhu dijaloga je red gotovih predložaka:

| Predložak | Sadržaj |
|---|---|
| *Osnovno* | zadani skup, isti kao na početnoj stranici |
| *Više* | dodatne karte kojih nema u osnovnom skupu |
| *Radari* | samo radari |
| *Sateliti* | samo sateliti |
| *Nevrijeme* | prognoze nevremena i munje |
| *Sve* | sve karte iz kataloga |
| *Ništa* | prazan popis, za slaganje od nule |

Klik na predložak učita njegov popis. Čim se nešto promijeni — dodana karta, drugi redoslijed — odabir skoči na **Prilagođeno**, a predložak iz kojeg je popis potekao dobije točkicu. Klikom na tu točkicu vraćate se na njega i odbacujete izmjene.

To skakanje na *Prilagođeno* je namjerno i važno kod dijeljenja: poveznica izmijenjenog predloška ne nosi njegovo ime nego goli popis karata, pa vas *Prilagođeno* unaprijed upozorava da se dijeli popis, a ne ime.

### Vlastiti predlošci

Na dnu dijaloga, pod **Moji predlošci**, sprema se trenutni izbor:

- **Spremi** — zapisuje trenutni popis (i, na računalu, razmještaj) pod imenom koje upišete.
- **Ažuriraj** — pojavljuje se uz predložak iz kojeg je popis potekao čim ga izmijenite; prepisuje ga novim stanjem.
- **Preimenuj** i **Obriši** — mijenjaju ime, odnosno brišu predložak. Preimenovanje ne kvari ranije spremljene postavke.

Gotovi predlošci se pod **Zadani predlošci** mogu sakriti iz gornjeg reda ako ih ne koristite. *Osnovno* se ne može sakriti.

Predložak označen plavim rubom spremljen je kao nadzorna ploča — vidi [Nadzorna ploča](#nadzorna-ploča).

### Dijeljenje

**Podijeli** kopira poveznicu u međuspremnik; natpis nakratko postane *Kopirano!*. Poveznica nosi cijeli prikaz — popis karata, redoslijed i razmještaj — pa tko je otvori vidi isto što i vi, bez da išta sprema.

Podijeliti se može trenutni izbor (gumbom u dijalogu) ili pojedini spremljeni predložak (poveznicom u njegovom redu). Otvorena podijeljena poveznica ne dira vaše spremljene postavke sve dok ne pritisnete *Primijeni*.

## Prozori

*Samo na računalu.*

Svaka naslovna traka ima gumb `[^]` koji kartu izdvaja iz stranice u prozor koji pluta iznad nje. Prozor ostaje na mjestu dok se stranica lista, pa se dvije ili tri karte mogu gledati istovremeno. Na mjestu karte u stranici ostaje traka s natpisom *Karta je izdvojena u prozor* i poveznicom **Vrati**.

Kad je karta izdvojena, u traci se pojavljuju dodatni gumbi:

| Gumb | Značenje |
|---|---|
| `[D]` | otvara još jedan prozor s istom kartom |
| `[R]` | ponovno učitava kartu — korisno kad je stranica dugo otvorena i slike su zastarjele; vidi i [Automatsko osvježavanje](#automatsko-osvježavanje) |
| `[+]` / `[-]` | spaja prozor sa susjednim u grupu, odnosno vadi ga iz nje |
| `[=]` | vraća kartu u stranicu |

Interaktivne karte nemaju `[R]` — one same dohvaćaju najnovije podatke, pa ih nema smisla ponovno učitavati.

**Kopije.** Gumb `[D]` (ili tipka <kbd>D</kbd>, koja kopira prozor na vrhu) otvara još jedan prozor s istom kartom. Ima ga i karta koja još stoji u stranici, pa se kopija može napraviti i bez prethodnog izdvajanja. Ista karta tako može stajati na ekranu više puta — npr. ista sinoptička karta u dvije veličine, ili isti niz slika zaustavljen na dvije različite slike.

Kopija je **samo prozor**: u stranici i dalje postoji jedan red po karti, koliko god kopija plutalo iznad nje. Zato `[=]` (na ploči `[x]`) na kopiji nju jednostavno makne, a karta i njena osnovna pojava ostaju. Svaka kopija ima svoje strelice i svoje kvadratiće, pa se niz slika u jednoj pomiče neovisno o drugoj.

Kopije su dio razmještaja — spremaju se u predložak i putuju u poveznici za dijeljenje, kao i položaj svakog drugog prozora. Ako se karta makne s popisa, s njom odlaze i njene kopije.

### Pomicanje i veličina

- **Pomicanje** — povlačenjem naslovne trake.
- **Veličina** — povlačenjem bilo kojeg ruba ili ugla.
- **Klik na prozor** podiže ga iznad ostalih. Ako je interaktivna karta prekrivena drugim prozorom, prvi klik podiže prozor, a tek sljedeći radi s kartom — kao kod prozora u operativnom sustavu. Karta koju ništa ne prekriva prima klik odmah.

Prozori se međusobno privlače: kad se rub približi rubu drugog prozora, sam sjedne na njega. Tako se lako slaže uredna mreža bez mjerkanja.

**Zajednički rub.** Kad dva prozora stoje jedan uz drugi i dodiruju se cijelom dužinom — jednako visoki jedan pored drugog, ili jednako široki jedan ispod drugog — taj rub je **šav**. Povlačenjem šava se ne mijenja jedan prozor nego oba: koliko jedan dobije, toliko drugi ustupi, a par zadrži isti prostor i ostatak razmještaja se ne pomiče. Svejedno je za koji se od dva prozora rub uhvati. Šav se privlači rubovima ostalih prozora kao i obični rub, a uz uključeno *Poravnaj uz mrežu* sjedne na mrežu kad se pusti.

**Samo jedan prozor.** Držite <kbd>Ctrl</kbd> dok hvatate šav i pomiče se rub samo jednog prozora — onoga s čije je strane šava pokazivač. Uhvatite rub malo unutar prozora koji želite mijenjati; drugi ostaje kakav jest.

Šav radi i za spojene i za nespojene prozore. Kod grupe vrijedi za **unutarnje** rubove; vanjski rub grupe i dalje razvlači cijelu grupu. Prozori se pritom oslobode omjera, jer se inače širina i visina ne mogu mijenjati odvojeno i šav bi se raspao usred povlačenja.

Rub koji nije zajednički cijelom dužinom nije šav i ponaša se kao i prije — mijenja samo svoj prozor.

Rub se povlači slobodno: širina i visina idu svaka za svojim. Karta se tada uklapa unutar okvira, s neoštrom kopijom slike kao podlogom. **Držite Shift** i prozor zadržava omjer slike, pa mu se mijenja samo širina — kao u programima za slike. Karta ga prati do koje god širine ga povučete; veća od svoje izvorne veličine postaje mekša, kao i svaka uvećana slika.

Shift vrijedi i usred povlačenja, ne samo na početku: pritisnite ga dok vučete i prozor se vraća na omjer, pustite ga i opet je slobodan. Miš se pritom ne mora micati. Ono što prozor na kraju ostane odlučuje tipka u trenutku puštanja ruba.

**Dvoklik na naslovnu traku** također vraća omjer, ali na svoj način: prozor se stisne oko karte kakva jest, umjesto da kartu rastegne na svoju širinu. Od dvije mjere uzima manju — praznina sa strane ili odozgo nestaje, a karta ostaje iste veličine. Prozor se pritom nikad ne poveća i ostaje na svom mjestu.

Kad je karta tako razvučena, naslovna traka ide cijelom širinom prozora, a slika stoji sredinom. Strelice `❮` i `❯` i kvadratići ispod nje drže se same slike, a ne cijelog prozora, pa pokazuju na ono što i jesu.

### Grupe

Dva prozora koja se dodiruju mogu se spojiti u grupu gumbom `[+]`. Grupa se pomiče i mijenja veličinu kao cjelina, a rubovi članova ostaju spojeni. `[-]` vadi prozor iz grupe. Samo dodirivanje nije dovoljno — grupa nastaje tek klikom.

### Bočni stupci

Prozor povučen do lijevog ili desnog ruba ekrana uskoči u stupac uz taj rub. Stupac je traka visine ekrana u kojoj karte stoje jedna ispod druge, a stranica se preslaguje u preostalu širinu.

- **Širina stupca** se mijenja povlačenjem njegovog unutarnjeg ruba.
- **Visina karte u stupcu** se mijenja povlačenjem njenog gornjeg ili donjeg ruba. Širinu daje stupac, pa karta pritom pusti omjer i uklopi se u okvir, isto kao pri slobodnom povlačenju ruba izvan stupca; **dvoklik na naslovnu traku** vraća omjer. Držite li Shift, omjer se zadržava — a s njim i visina, jer je ona tada stupčeva.
- **Kad se stupci dodiruju**, jedan zajednički rub premješta širinu s jednog na drugi.
- **Dvoklik na rub stupca** sakriva stranicu (stupci preuzmu cijelu širinu); ponovni dvoklik je vraća na prijašnje širine. Dok je stranica sakrivena, na vrhu ekrana visi narančasta pločica **Karte** — put do dijaloga dok gumba na stranici nema. Na njoj tada stoji samo ime; gumbe nosi samo na [nadzornoj ploči](#nadzorna-ploča).
- **Karta izlazi iz stupca** povlačenjem u stranu.

## Nadzorna ploča

*Samo na računalu.*

Nadzorna ploča sakriva stranicu i svaku kartu s popisa pretvara u prozor. Ostaju samo karte na praznoj podlozi — prikaz za ekran koji stoji uključen i gleda se izdaleka.

Uključuje se u dijalogu *Karte*, gumbom **Nadzorna ploča**, i primjenjuje zajedno s popisom pritiskom na *Primijeni*. Isključuje se isto tako, ili gumbom *Vrati sve*.

Na ploči:

- Gumb **Posloži** u dijalogu (ili `[A]` na pločici, ili tipka <kbd>A</kbd>) razmjesti sve karte u pravilnu mrežu, jednakih veličina i bez razmaka. Broj stupaca i redova se odabire tako da karte budu što veće, prema broju karata, njihovom obliku i obliku ekrana — četiri karte daju 2x2, šest 3x2, deset 4x3 (s dva prazna mjesta), dvanaest 4x3. Isto se dogodi i pri prvom ulasku na ploču.
- Karte se pritom **oslobode omjera** i uklope u svoje polje, s neoštrom kopijom slike kao podlogom. Drukčije i ne može: uz jednaku širinu svaka bi karta imala svoju visinu i nijedan red se ne bi poklapao. Dvoklik na naslovnu traku vraća pojedinu kartu u njen omjer.
- Gumb `[=]` u traci postaje `[x]` i **miče kartu s popisa** — na ploči nema stranice u koju bi se vratila.
- Karta dodana u popis pojavi se na ploči na prvom slobodnom mjestu.
- Bočnih stupaca nema; stupac je traka koju stranica ustupa, a stranice ovdje nema.
- Na vrhu ekrana visi narančasta pločica **Karte**. Ona je jedini put natrag do dijaloga jer je gumb na stranici sakriven. Pločica se povlači lijevo-desno i razvlači za rubove, najviše do polovice širine ekrana. Blijeda je dok se ne treba — pune boje postaje pod mišem i dok je dijalog otvoren. Samo ovdje uz ime nosi i gumbe `[R]`, `[A]`, `[G]` i `[S]`, a na lijevom kraju `[⌂]`, koji vodi na početnu stranicu (s <kbd>Ctrl</kbd> ili srednjim klikom u novoj kartici).

Ploča se sprema kao i svaki drugi prikaz — u predložak ili u poveznicu za dijeljenje — pa se može imati više različitih ploča.

### Mreža

Na ploči se karte mogu slagati po mreži. Dva prekidača, u dijalogu i na pločici:

| Prekidač | Pločica | Tipka | Značenje |
|---|---|---|---|
| *Posloži* | `[A]` | <kbd>A</kbd> | slaže karte u pravilnu mrežu |
| *Prikaži mrežu* | `[G]` | <kbd>G</kbd> | crta mrežu po podlozi |
| *Poravnaj uz mrežu* | `[S]` | <kbd>S</kbd> | karta puštena iz ruke sjeda na najbliže crte |

Poravnavanje djeluje tek kad pustite kartu, pa povlačenje ostaje slobodno. Svaki od četiri ruba ide na svoju najbližu crtu, pa se karta razvuče ili stisne da pristane, umjesto da se samo pomakne.

Za razliku od ostalog, ova dva prekidača **ne putuju** u predlošku ni u poveznici — oni su način rada, ne dio prikaza, i vrijede samo u ovom pregledniku.

## Cijeli zaslon

Interaktivne karte imaju gumb `[ ]` koji ih otvara preko cijelog zaslona. Isto radi i **dvoklik na naslovnu traku** izdvojenog prozora.

Izlazi se istim gumbom, ponovnim dvoklikom na traku ili tipkom <kbd>Esc</kbd>.

Karta u bočnom stupcu se ne širi preko cijelog ekrana nego popuni svoj stupac, pa stranica pokraj nje ostaje u upotrebi.

Na [nadzornoj ploči](#nadzorna-ploča) karta uzme cijeli ekran, osim sa strane koju neki drugi prozor **pregrađuje** — dakle koju zatvara cijelom visinom, odnosno širinom. Prozor uz cijeli lijevi rub tako ostavi kartu na desnoj polovici; prozor u kutu ne pregrađuje ništa, pa karta ide preko cijelog ekrana, a taj prozor ostane stajati u svom kutu iznad nje. Nekoliko prozora poredanih jedan ispod drugog pregrađuju zajedno. Prozori su uvijek iznad karte, pa se ništa ne gubi kad ih prekrije.

## Tipke i geste

*Samo na računalu.*

| Tipka | Radnja |
|---|---|
| <kbd>K</kbd> | otvara i zatvara dijalog *Karte* |
| <kbd>Enter</kbd> | u dijalogu *Karte* primjenjuje promjene (kao *Primijeni*) |
| <kbd>H</kbd> | otvara i zatvara *Upute* |
| <kbd>Esc</kbd> | zatvara dijalog; ako je zatvoren, izlazi iz cijelog zaslona |
| <kbd>R</kbd> | ponovno učitava sve karte |
| <kbd>A</kbd> | slaže karte u mrežu (na ploči) |
| <kbd>D</kbd> | kopira prozor koji je na vrhu |
| <kbd>G</kbd> | prikaz mreže (na ploči) |
| <kbd>S</kbd> | poravnavanje uz mrežu (na ploči) |
| strelice | pomiču prozor koji je na vrhu za jedno polje mreže |
| <kbd>Shift</kbd> + strelice | isto, ali za jedan piksel |
| <kbd>Shift</kbd> + povlačenje ruba | zadržava omjer slike; vrijedi i usred povlačenja |

Strelice pomiču onaj prozor koji je posljednji podignut, dakle onaj koji je vidljivo iznad ostalih. Ako se pomaknuo krivi, kliknite na onaj koji ste htjeli i ponovite. Dok je dijalog *Karte* otvoren, strelice pripadaju njemu — listaju njegov popis i ne pomiču prozor ispod njega. <kbd>G</kbd> i <kbd>S</kbd> rade i tada, jer su ta dva prekidača i u samom dijalogu.

> **Tipke ne rade dok je fokus u interaktivnoj karti.** Kad kliknete u Windy ili Blitzortung, tipke prima ta karta, a ne stranica. Kliknite na naslovnu traku ili bilo gdje po stranici i tipke ponovno rade.

Geste na naslovnoj traci prozora:

| Gesta | Radnja |
|---|---|
| povlačenje | pomiče prozor |
| dvoklik | cijeli zaslon (interaktivne karte) ili stiskanje prozora oko karte (slike) |
| srednji klik | vraća kartu u stranicu; na ploči je miče s popisa |

## Što se pamti

Stranica pamti na tri različita načina i vrijedi znati koji je koji.

**1. Prikaz** — popis karata, njihov redoslijed i razmještaj prozora. Sprema se pritiskom na *Primijeni* i vraća se pri sljedećem otvaranju stranice. Ovo je ono što ide u spremljeni predložak i u poveznicu za dijeljenje.

**2. Samo ovaj preglednik** — položaj i veličina dijaloga, položaj i širina pločice *Karte*, dva prekidača mreže te automatsko osvježavanje. To se tiče ovog ekrana, a ne prikaza, pa **ne putuje** ni u predlošku ni u poveznici. Dvoklik na zaglavlje dijaloga vraća ga na zadano mjesto i veličinu.

**3. Podijeljena poveznica** — nosi cijeli prikaz u adresi, bez da išta sprema kod onoga tko je otvori. Njegove postavke ostaju netaknute dok ne pritisne *Primijeni*.

Sve se sprema lokalno u pregledniku. Ništa se ne šalje nikamo i ništa ne prelazi na drugi uređaj osim poveznicom koju sami podijelite. Brisanje podataka preglednika briše i ovo.

## Na mobitelu

Na dodirnim ekranima stranica je obična okomita lista karata. Nema izdvojenih prozora, bočnih stupaca, nadzorne ploče ni mreže — sve su to stvari za miša i široki ekran.

Radi:

- odabir karata i redoslijed prikaza,
- predlošci, spremanje i dijeljenje,
- listanje karata s više slika prelaskom prsta,
- dvostruki dodir za pristup interaktivnoj karti,
- cijeli zaslon.

Dijalog *Karte* na mobitelu zauzima cijeli ekran i zatvara se natpisom *Zatvori* u zaglavlju.

Ako ste na računalu složili razmještaj prozora, a stranicu otvorite na mobitelu, razmještaj se ne gubi — samo se ne prikazuje. Vratit će se kad stranicu otvorite na računalu.
