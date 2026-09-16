# Upute

**Meteo radari** na jednom mjestu prikazuje radarske i satelitske karte, munje, prognoze nevremena i sinoptičke karte iz više izvora, bez otvaranja desetak stranica.

Stranica ima dva dijela:

- **Početna** — stalan popis karata. Ništa se ne podešava, uvijek je isto i odmah se otvori.
- **Prilagodi** — isti prikaz, ali sami birate koje se karte vide i kojim redoslijedom, a na računalu i kako su razmještene po ekranu. Do nje se dolazi gumbom *Prilagodi* na početnoj stranici.

Poglavlje [Karte na stranici](#karte-na-stranici) vrijedi za oba dijela, a sve ostalo samo za *Prilagodi*.

Izdvojeni prozori, bočni stupci i nadzorna ploča rade samo na računalu, odnosno na ekranu širem od 800 px s mišem. Na dodirnim ekranima stranica ostaje obična, okomita lista karata — vidi [Na mobitelu](#na-mobitelu).

## Karte na stranici

Svaka karta ima naslovnu traku s imenom izvora. Ime je ujedno i poveznica na izvornu stranicu.

**Karte s više slika** (npr. *Neverin | Radar | Hrvatska*) imaju strelice `❮` i `❯` na rubovima i niz kvadratića ispod slike koji pokazuje na kojoj ste slici. Na dodirnom ekranu slike se mijenjaju i prelaskom prsta.

**Interaktivne karte** (Windy, Blitzortung, meteoblue i slične) u početku ne primaju miš — preko njih stoji prozirni sloj s natpisom *Dvostruki klik za pristup interaktivnoj karti*. Bez njega bi se karta pomicala dok se stranica lista. Dvostrukim klikom sloj nestaje i kartom se dalje radi normalno.

Gumbi u traci interaktivne karte:

| Gumb | Značenje |
|---|---|
| `[HR]` / `[EU]` | prebacuje između prikaza Hrvatske i Europe |
| `[X]` | pojavi se kad se sloj ukloni; vraća sloj, a zatim postaje `[R]` |
| `[R]` | vraća kartu na početni položaj i zumiranje |
| `[ ]` | otvara kartu preko cijelog zaslona; tada postaje `[-]`, koji je zatvara |

**Cijeli zaslon.** Iz cijelog zaslona izlazi se gumbom `[-]` ili tipkom <kbd>Esc</kbd>. Za ponašanje u bočnom stupcu i na ploči vidi [Bočni stupci](#bočni-stupci) i [Nadzorna ploča](#nadzorna-ploča).

**Linkovi.** Gumb *Linkovi* vodi na popis dodatnih izvora na dnu stranice. Kvadratić pokraj njega uključuje prikaz linkova ispod svake karte.

**Upute.** Ovaj tekst otvaraju gumb `?`, poveznica *Upute* u podnožju i tipka <kbd>H</kbd>. Otvara se u prozoru preko stranice, pa se upute mogu čitati uz karte. Zatvara se natpisom *Zatvori* ili tipkom <kbd>Esc</kbd>. Poveznica koja završava s `#upute` otvara upute odmah pri učitavanju stranice.

## Dijalog Karte

Gumb **Karte** (ili tipka <kbd>K</kbd>) otvara dijalog u kojem se bira što se prikazuje. Kad gumb na stranici nije dostupan, dijalog se otvara s [pločice Karte](#pločica-karte) na vrhu ekrana.

Dok je dijalog otvoren, stranica iza njega je malo zatamnjena i ne reagira. Klik izvan dijaloga samo ga zatvara — taj klik ne ide dalje, pa neće usput otvoriti poveznicu ni pomaknuti prozor.

**Ništa se ne primjenjuje dok ne pritisnete Primijeni** ili tipku <kbd>Enter</kbd>. Zatvaranje dijaloga bez toga — natpisom *Zatvori*, tipkom <kbd>Esc</kbd> ili klikom izvan njega — odbacuje sve promjene. Iznimka su prekidači mreže i automatsko osvježavanje, koji djeluju odmah.

Na računalu se dijalog pomiče povlačenjem zaglavlja, a veličina mu se mijenja povlačenjem rubova ili uglova. Dvoklik na zaglavlje vraća ga na početno mjesto i veličinu. Na mobitelu zauzima cijeli ekran.

Dijalog je, odozgo prema dolje:

- red **predložaka**,
- red **Nadzorna ploča** s prekidačima mreže i gumbom *Posloži* (samo na računalu),
- red **Osvježavaj svakih**,
- redak **Izdvojene karte** s poveznicom *Vrati sve* — samo kad je neka karta izdvojena u prozor,
- **odabrane karte**, a ispod njih *Primijeni* i *Podijeli*,
- **sve dostupne karte**, s poretkom i okvirom za traženje,
- **Zadani predlošci** i **Moji predlošci**.

### Odabir karata

Dijalog ima dva popisa:

- **Odabrane karte** su redoslijed prikaza. Karte se premještaju povlačenjem za znak `≡`.
- **Dostupne karte** su sve ostale. Kvadratić pokraj karte dodaje je na kraj odabranih.

Ispred svakog imena stoji znak vrste karte: 📡 radar, 🛰️ satelit, ⚡ munje, 🌡️ temperatura, ⛈️ nevrijeme, 🗺️ sinoptika, 📷 kamera, 📈 prognoza.

Dostupne karte mogu se poredati po *Zadano*, *Naziv* ili *Vrsta*; ponovni klik na isti poredak okreće smjer. To služi samo za traženje i ne mijenja redoslijed prikaza.

**Traženje.** Upisani pojam traži se i u imenu i u vrsti karte, pa *munje* izdvoji sve munje, a *neverin* sve karte tog izvora. Svaka dodatna riječ sužava popis — *neverin radar* nađe oba Neverinova radara, *neverin radar hrvatska* samo jedan. Kvačice nisu potrebne: *chmu* nalazi *ČHMÚ*, *sinopticka* nalazi *Sinoptička*.

Traženje filtrira samo dostupne karte; odabrane ostaju cijele, jer se po njima povlači. Pojam ostaje upisan i nakon odabira karte ili predloška. Briše se znakom `×` ili tipkom <kbd>Esc</kbd>; <kbd>Esc</kbd> u praznom okviru zatvara dijalog.

> Ako na stranici piše *Nema odabranih karata*, popis je prazan — otvorite *Karte* i odaberite barem jednu.

### Predlošci

Na vrhu dijaloga je red predložaka:

| Predložak | Sadržaj |
|---|---|
| *Osnovno* | zadani skup, isti kao na početnoj stranici |
| *Više* | dodatne karte kojih nema u osnovnom skupu |
| *Radari* | samo radari |
| *Sateliti* | samo sateliti |
| *Nevrijeme* | prognoze nevremena i munje |
| *Sve* | sve karte |
| *Ništa* | prazan popis, za slaganje od nule |

Iza njih slijede vaši spremljeni predlošci, a na kraju **Prilagođeno**.

Klik na predložak učita njegov popis. Čim se popis promijeni — dodana karta, drugi redoslijed — odabir skoči na *Prilagođeno*, a predložak iz kojeg je popis potekao dobije točkicu. Klik na njega vraća njegov popis i odbacuje izmjene.

Skok na *Prilagođeno* ujedno upozorava da izmijenjeni popis više nije taj predložak: poveznica za dijeljenje tada nosi popis karata, a ne ime predloška.

Predložak označen plavim rubom spremljen je kao [nadzorna ploča](#nadzorna-ploča).

### Moji predlošci

Na dnu dijaloga, pod **Moji predlošci**:

- **Dodaj** otvara polje za ime; **Spremi** (ili <kbd>Enter</kbd>) sprema trenutni popis pod tim imenom, a na računalu i razmještaj prozora.
- **Ažuriraj** se pojavi uz predložak iz kojeg je popis potekao čim ga izmijenite, i prepisuje ga trenutnim stanjem.
- **Preimenuj** mijenja ime, a **Obriši** briše predložak. Karte na ekranu pritom ostaju kakve jesu.
- **Podijeli** kopira poveznicu na taj predložak.

Pod **Zadani predlošci** gotovi predlošci mogu se sakriti iz reda na vrhu (*Sakrij*, *Sakrij sve*) i vratiti (*Prikaži*, *Prikaži sve*). *Osnovno* se ne može sakriti.

### Dijeljenje

**Podijeli** kopira poveznicu u međuspremnik, a natpis nakratko postane *Kopirano!*. Poveznica nosi cijeli prikaz — popis karata, redoslijed i razmještaj — pa tko je otvori vidi isto što i vi.

Gumb *Podijeli* ispod odabranih karata dijeli ono što je trenutno u dijalogu, a poveznica u redu spremljenog predloška dijeli taj predložak. Kad netko otvori poveznicu vlastitog predloška, dijalog mu nudi da ga spremi pod istim imenom.

Otvorena poveznica ne dira spremljene postavke onoga tko ju je otvorio sve dok ne pritisne *Primijeni*.

### Automatsko osvježavanje

Slike zastare na stranici koja je dugo otvorena. Red **Osvježavaj svakih** ima kvadratić i razmak od 5, 10, 15, 30 ili 60 minuta. Isključeno je dok se ne uključi, a početni razmak je 5 minuta. Djeluje odmah, bez *Primijeni*.

Osvježavaju se slike, nizovi slika, videa i jednostavne karte. Interaktivne karte se preskaču: one same dohvaćaju najnovije podatke, a ponovno učitavanje samo bi im poništilo pomak i zumiranje.

Vrijeme do sljedećeg osvježavanja piše u tom redu i na [pločici Karte](#pločica-karte). Odbrojavanje kreće ispočetka pri svakom osvježavanju svih karata — automatskom, ručnom (`[R]` na pločici ili tipka <kbd>R</kbd>) i pri ponovnom učitavanju stranice. `[R]` na pojedinoj karti osvježi samo nju i ne dira odbrojavanje, osim ako je to jedina karta koja se osvježava.

## Prozori

*Samo na računalu.*

Svaka naslovna traka ima gumb `[^]` koji kartu izdvaja iz stranice u prozor koji pluta iznad nje. Prozor ostaje na mjestu dok se stranica lista, pa se nekoliko karata može gledati istovremeno. Na mjestu karte u stranici ostaje traka *Karta je izdvojena u prozor* s poveznicom **Vrati**. Sve prozore odjednom vraća *Vrati sve* u dijalogu.

Gumbi u traci prozora:

| Gumb | Značenje |
|---|---|
| `[D]` | otvara kopiju karte u novom prozoru (ima ga i karta u stranici) |
| `[R]` | ponovno učitava kartu (interaktivne karte ga nemaju) |
| `[+]` / `[-]` | spaja prozor sa susjednim u grupu, odnosno vadi ga iz nje |
| `[=]` | vraća kartu u stranicu; na ploči je `[x]` i miče kartu s popisa |

### Pomicanje i veličina

- **Pomicanje** — povlačenjem naslovne trake ili strelicama (vidi [Tipke i geste](#tipke-i-geste)).
- **Veličina** — povlačenjem bilo kojeg ruba ili ugla.
- **Klik na prozor** podiže ga iznad ostalih. Ako je interaktivna karta djelomično prekrivena drugim prozorom, prvi klik je podiže, a tek sljedeći ide karti.

Prozori se međusobno privlače: rub koji se približi rubu drugog prozora sam sjedne na njega, pa se prozori lako slažu jedan uz drugi.

**Omjer.** Prozor sa slikom ili videom u početku drži omjer karte — kad mu se mijenja širina, visina je prati. Čim se rub povuče, prozor se oslobodi omjera: širina i visina idu svaka za svojim, a karta se uklopi unutar okvira, s neoštrom kopijom slike kao podlogom.

- Držite li <kbd>Shift</kbd> dok povlačite rub, prozor zadržava omjer. Vrijedi i usred povlačenja — što je tipka u trenutku puštanja, to prozor ostaje.
- **Dvoklik na naslovnu traku** vraća omjer tako da se prozor stisne oko karte kakva jest: praznina sa strane ili odozgo nestane, a karta ostane iste veličine i na istom mjestu.

Karta uvećana preko svoje izvorne veličine postaje mekša, kao i svaka uvećana slika.

### Šavovi

Kad dva prozora stoje jedan uz drugi i dodiruju se cijelom dužinom ruba — jednako visoki jedan pored drugog, ili jednako široki jedan ispod drugog — taj zajednički rub je **šav**. Povlačenjem šava mijenjaju se oba prozora: koliko jedan dobije, toliko drugi ustupi, a ostatak razmještaja se ne miče. Svejedno je za koji se od dva prozora rub uhvati.

- Šav se, kao i obični rub, privlači rubovima ostalih prozora, a uz uključeno *Poravnaj uz mrežu* sjedne na mrežu kad se pusti.
- Držite li <kbd>Ctrl</kbd> dok hvatate šav, pomiče se rub samo jednog prozora — onoga s čije je strane šava pokazivač.
- Šav postoji samo na stranicama, ne u uglovima. Rub koji dva prozora dijele samo djelomično nije šav i mijenja samo svoj prozor.
- Oba prozora se pritom oslobode omjera, jer se inače šav ne bi mogao pomicati.

### Grupe

Dva prozora koja se dodiruju mogu se spojiti u grupu gumbom `[+]`; samo dodirivanje nije dovoljno. Grupa se pomiče i mijenja veličinu kao cjelina, a članovi ostaju spojeni. Unutarnji rubovi grupe su šavovi, a vanjski rub mijenja veličinu cijele grupe. `[-]` vadi prozor iz grupe.

### Kopije

Gumb `[D]` (ili tipka <kbd>D</kbd>, za prozor na vrhu) otvara još jedan prozor s istom kartom — npr. ista sinoptička karta u dvije veličine, ili isti niz slika zaustavljen na dvije različite slike. Kopija se otvori malo pomaknuta i iste veličine kao prozor iz kojeg je nastala. Svaka kopija ima svoje strelice i kvadratiće.

Kopija je samo prozor: u stranici i dalje postoji jedan red po karti. Nijedan prozor nije „izvorni” — `[=]` (na ploči `[x]`) na bilo kojem prozoru dok ih ima još s istom kartom samo njega makne, a ostali ostaju gdje jesu. Tek zadnji vraća kartu u stranicu (na ploči je miče s popisa). Kopije su dio razmještaja, pa se spremaju u predložak i putuju u poveznici. Karta maknuta s popisa odnese sa sobom i svoje kopije.

### Bočni stupci

Prozor povučen do lijevog ili desnog ruba ekrana uskoči u stupac uz taj rub. U stupcu karte stoje jedna ispod druge, a stranica se preslaže u preostalu širinu.

- **Širina stupca** mijenja se povlačenjem njegovog unutarnjeg ruba. Kad se dva stupca dodiruju, zajednički rub premješta širinu s jednog na drugi.
- **Visina karte** mijenja se povlačenjem njenog gornjeg ili donjeg ruba. Širinu daje stupac, pa se karta pritom oslobodi omjera; s <kbd>Shift</kbd> zadržava omjer, a dvoklik na naslovnu traku ga vraća.
- **Karta izlazi iz stupca** povlačenjem naslovne trake u stranu.
- **Dvoklik na rub stupca** sakriva stranicu, pa stupci preuzmu cijelu širinu. Ponovni dvoklik vraća prijašnje širine. Dok je stranica sakrivena, dijalog se otvara s [pločice Karte](#pločica-karte).
- **Cijeli zaslon** u stupcu popuni samo taj stupac, pa stranica pokraj njega ostaje u upotrebi.

## Nadzorna ploča

*Samo na računalu.*

Nadzorna ploča sakriva stranicu i svaku kartu s popisa pretvara u prozor. Ostaju samo karte na tamnoj podlozi — prikaz za ekran koji je stalno uključen i gleda se izdaleka.

Uključuje se gumbom **Nadzorna ploča** u dijalogu i primjenjuje, zajedno s popisom, pritiskom na *Primijeni*. Isključuje se na isti način. Predložak spremljen dok je ploča uključena otvara se kao ploča, pa se može imati više različitih ploča.

Na ploči:

- **Posloži** (u dijalogu, `[A]` na pločici ili tipka <kbd>A</kbd>) razmjesti sve karte u pravilnu mrežu, jednakih veličina i bez razmaka. Broj stupaca i redova bira se tako da karte budu što veće, s obzirom na njihov oblik i oblik ekrana — četiri karte daju 2x2, šest 3x2, deset 4x3. Karte se pritom oslobode omjera; dvoklik na naslovnu traku vraća ga pojedinoj karti. Isto se dogodi i pri prvom ulasku na ploču.
- `[x]` u traci prozora ili srednji klik na traku **miče kartu s popisa** — na ploči nema stranice u koju bi se vratila.
- Karta dodana u popis pojavi se na ploči uz gornji lijevi kut, stepenasto ispod ostalih novih.
- Bočnih stupaca nema; prozor doveden do ruba ekrana ostaje prozor.
- **Cijeli zaslon** zauzme cijeli ekran, osim strane koju neki prozor zatvara cijelom visinom ili širinom. Prozor uz cijeli lijevi rub ostavi kartu na desnoj strani; prozor u kutu ne zatvara ništa, pa karta ide preko cijelog ekrana, a on ostaje iznad nje.

### Mreža

Na ploči se karte mogu slagati po mreži od kvadratića. Dva prekidača, u dijalogu i na pločici, djeluju odmah, bez *Primijeni*:

| Prekidač | Pločica | Tipka | Značenje |
|---|---|---|---|
| *Prikaži mrežu* | `[G]` | <kbd>G</kbd> | crta mrežu po podlozi |
| *Poravnaj uz mrežu* | `[S]` | <kbd>S</kbd> | prozor pušten iz ruke sjeda na mrežu |

Poravnavanje djeluje tek kad se prozor pusti, pa je povlačenje slobodno. Svaki rub ide na svoju najbližu crtu, pa se prozor po potrebi malo razvuče ili stisne. Strelice pomiču prozor za točno jedan kvadratić, pa poravnani prozor ostaje poravnan.

## Pločica Karte

Kad gumb *Karte* na stranici nije dostupan, na vrhu ekrana visi narančasta pločica **Karte**; klik na nju otvara dijalog. Pojavljuje se:

- na [nadzornoj ploči](#nadzorna-ploča),
- dok su [bočni stupci](#bočni-stupci) sakrili stranicu,
- dok je uključeno [automatsko osvježavanje](#automatsko-osvježavanje) — tada nosi odbrojavanje i `[R]`, koji odmah osvježava sve karte.

Na ploči uvijek nosi `[R]`, uz njega i `[A]`, `[G]` i `[S]`, a na lijevom kraju ikonu stranice, koja vodi na početnu stranicu (s <kbd>Ctrl</kbd> ili srednjim klikom u novoj kartici).

Pločica je blijeda dok ne zatreba — pune boje postaje pod mišem i dok je dijalog otvoren. Povlači se lijevo-desno, a za rubove se razvlači, najviše do polovice širine ekrana.

## Tipke i geste

Tipke ne rade dok je kursor u polju za upis.

| Tipka | Radnja |
|---|---|
| <kbd>K</kbd> | otvara i zatvara dijalog *Karte* |
| <kbd>Enter</kbd> | u dijalogu *Karte*: primjenjuje promjene |
| <kbd>H</kbd> | otvara i zatvara *Upute* |
| <kbd>Esc</kbd> | zatvara dijalog; ako nijedan nije otvoren, izlazi iz cijelog zaslona |
| <kbd>R</kbd> | ponovno učitava sve karte |
| <kbd>D</kbd> | kopira prozor na vrhu |
| <kbd>A</kbd> | na ploči: slaže karte u mrežu |
| <kbd>G</kbd> | na ploči: prikazuje ili skriva mrežu |
| <kbd>S</kbd> | na ploči: uključuje ili isključuje poravnavanje uz mrežu |
| strelice | pomiču prozor na vrhu za jedan kvadratić mreže |
| <kbd>Shift</kbd> + strelice | isto, za jedan piksel |

Tipke <kbd>R</kbd>, <kbd>D</kbd>, <kbd>A</kbd>, <kbd>G</kbd>, <kbd>S</kbd> i strelice rade samo na računalu. Strelice pomiču prozor koji je posljednji podignut; ako se pomaknuo krivi, kliknite na onaj koji želite i ponovite. Dok je dijalog otvoren, strelice listaju dijalog i ne pomiču prozore.

> **Tipke ne rade dok je fokus u interaktivnoj karti.** Kad kliknete u Windy ili Blitzortung, tipke prima ta karta, a ne stranica. Kliknite na naslovnu traku ili bilo gdje po stranici i tipke ponovno rade.

Mišem, na naslovnoj traci prozora:

| Gesta | Radnja |
|---|---|
| povlačenje | pomiče prozor |
| dvoklik | interaktivna karta: cijeli zaslon; slika: vraća omjer |
| srednji klik | vraća kartu u stranicu; na ploči je miče s popisa |

Mišem, na rubovima:

| Gesta | Radnja |
|---|---|
| povlačenje ruba ili ugla | mijenja veličinu prozora |
| <kbd>Shift</kbd> + povlačenje | isto, uz zadržan omjer |
| povlačenje šava | pomiče zajednički rub dvaju prozora |
| <kbd>Ctrl</kbd> + povlačenje šava | pomiče rub samo jednog prozora |
| dvoklik na rub stupca | sakriva ili vraća stranicu |

## Što se pamti

Sve se sprema samo u ovom pregledniku. Ništa se ne šalje nikamo i ništa ne prelazi na drugi uređaj, osim poveznicom koju sami podijelite. Brisanjem podataka preglednika briše se i ovo.

**Prikaz** — popis karata, redoslijed, razmještaj prozora i nadzorna ploča. Sprema se pritiskom na *Primijeni* i vraća pri sljedećem otvaranju stranice. Samo prikaz ide u predložak i u poveznicu za dijeljenje. Razmještaj se mijenja i sprema i bez *Primijeni*, čim pomaknete prozor.

**Postavke preglednika** — položaj i veličina dijaloga i uputa, položaj i širina pločice, prekidači mreže i automatsko osvježavanje. One se tiču ovog ekrana, a ne prikaza, pa ne putuju ni u predlošku ni u poveznici.

**Podijeljena poveznica** — nosi prikaz u adresi. Dok je otvorena, prikazuje se ono što ona nosi, a vaše spremljene postavke ostaju netaknute dok ne pritisnete *Primijeni*.

## Na mobitelu

Na dodirnim ekranima stranica je obična okomita lista karata. Nema izdvojenih prozora, bočnih stupaca ni nadzorne ploče.

Radi:

- odabir karata i redoslijed prikaza,
- predlošci, spremanje i dijeljenje,
- automatsko osvježavanje,
- listanje karata s više slika prelaskom prsta,
- dvostruki dodir za pristup interaktivnoj karti,
- cijeli zaslon.

Dijalog *Karte* na mobitelu zauzima cijeli ekran i zatvara se natpisom *Zatvori* u zaglavlju.

Razmještaj prozora složen na računalu ne gubi se kad stranicu otvorite na mobitelu — samo se ne prikazuje, a vraća se čim je ponovno otvorite na računalu.
