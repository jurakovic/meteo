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

## Odabir karata

Gumb **Karte** otvara dijalog u kojem se bira što se prikazuje. Dijalog nije modalan — stranica iza njega ostaje vidljiva, a na računalu se prozori mogu razmještati dok je otvoren.

Dijalog ima dva popisa:

- **Gornji popis** je redoslijed prikaza. Karte se povlače za znak `≡` i time se mijenja poredak na stranici.
- **Donji popis** su sve dostupne karte. Služi samo za pronalaženje — kvadratić pokraj karte dodaje je na kraj gornjeg popisa.

Ispred svakog imena stoji znak vrste karte: 📡 radar, 🛰️ satelit, ⚡ munje, 🌡️ temperatura, ⛈️ nevrijeme, 🗺️ sinoptika, 📷 kamera, 📈 prognoza.

Donji popis se može poredati po *Zadano*, *Naziv* ili *Vrsta*; ponovni klik na isti okreće smjer. To ne mijenja redoslijed prikaza, samo pomaže u traženju.

Ništa se ne primjenjuje dok se ne pritisne **Primijeni**. Zatvaranje dijaloga bez toga poništava promjene.

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
| `[R]` | ponovno učitava kartu — korisno kad je stranica dugo otvorena i slike su zastarjele |
| `[+]` / `[-]` | spaja prozor sa susjednim u grupu, odnosno vadi ga iz nje |
| `[=]` | vraća kartu u stranicu |

Interaktivne karte nemaju `[R]` — one same dohvaćaju najnovije podatke, pa ih nema smisla ponovno učitavati.

### Pomicanje i veličina

- **Pomicanje** — povlačenjem naslovne trake.
- **Veličina** — povlačenjem bilo kojeg ruba ili ugla.
- **Klik na prozor** podiže ga iznad ostalih. Ako je interaktivna karta prekrivena drugim prozorom, prvi klik podiže prozor, a tek sljedeći radi s kartom — kao kod prozora u operativnom sustavu. Karta koju ništa ne prekriva prima klik odmah.

Prozori se međusobno privlače: kad se rub približi rubu drugog prozora, sam sjedne na njega. Tako se lako slaže uredna mreža bez mjerkanja.

Slike i videa zadržavaju svoj omjer, pa im se mijenja samo širina. Ako želite slobodnu visinu, **držite Shift dok počinjete povlačiti rub** — karta se tada uklapa unutar okvira, s neoštrom kopijom slike kao podlogom. Povlačenje bez Shifta, ili dvoklik na naslovnu traku, vraća omjer.

### Grupe

Dva prozora koja se dodiruju mogu se spojiti u grupu gumbom `[+]`. Grupa se pomiče i mijenja veličinu kao cjelina, a rubovi članova ostaju spojeni. `[-]` vadi prozor iz grupe. Samo dodirivanje nije dovoljno — grupa nastaje tek klikom.

### Bočni stupci

Prozor povučen do lijevog ili desnog ruba ekrana uskoči u stupac uz taj rub. Stupac je traka visine ekrana u kojoj karte stoje jedna ispod druge, a stranica se preslaguje u preostalu širinu.

- **Širina stupca** se mijenja povlačenjem njegovog unutarnjeg ruba.
- **Kad se stupci dodiruju**, jedan zajednički rub premješta širinu s jednog na drugi.
- **Dvoklik na rub stupca** sakriva stranicu (stupci preuzmu cijelu širinu); ponovni dvoklik je vraća na prijašnje širine.
- **Karta izlazi iz stupca** povlačenjem u stranu.

## Nadzorna ploča

*Samo na računalu.*

Nadzorna ploča sakriva stranicu i svaku kartu s popisa pretvara u prozor. Ostaju samo karte na praznoj podlozi — prikaz za ekran koji stoji uključen i gleda se izdaleka.

Uključuje se u dijalogu *Karte*, gumbom **Nadzorna ploča**, i primjenjuje zajedno s popisom pritiskom na *Primijeni*. Isključuje se isto tako, ili gumbom *Vrati sve*.

Na ploči:

- Gumb `[=]` u traci postaje `[x]` i **miče kartu s popisa** — na ploči nema stranice u koju bi se vratila.
- Karta dodana u popis pojavi se na ploči na prvom slobodnom mjestu.
- Bočnih stupaca nema; stupac je traka koju stranica ustupa, a stranice ovdje nema.
- Na vrhu ekrana visi narančasta pločica **Karte**. Ona je jedini put natrag do dijaloga jer je gumb na stranici sakriven. Pločica se povlači lijevo-desno i razvlači za rubove.

Ploča se sprema kao i svaki drugi prikaz — u predložak ili u poveznicu za dijeljenje — pa se može imati više različitih ploča.

### Mreža

Na ploči se karte mogu slagati po mreži. Dva prekidača, u dijalogu i na pločici:

| Prekidač | Pločica | Tipka | Značenje |
|---|---|---|---|
| *Prikaži mrežu* | `[G]` | <kbd>G</kbd> | crta mrežu po podlozi |
| *Poravnaj uz mrežu* | `[S]` | <kbd>S</kbd> | karta puštena iz ruke sjeda na najbliže crte |

Poravnavanje djeluje tek kad pustite kartu, pa povlačenje ostaje slobodno. Svaki od četiri ruba ide na svoju najbližu crtu, pa se karta razvuče ili stisne da pristane, umjesto da se samo pomakne.

Za razliku od ostalog, ova dva prekidača **ne putuju** u predlošku ni u poveznici — oni su način rada, ne dio prikaza, i vrijede samo u ovom pregledniku.

## Cijeli zaslon

Interaktivne karte imaju gumb `[ ]` koji ih otvara preko cijelog zaslona. Isto radi i **dvoklik na naslovnu traku** izdvojenog prozora.

Izlazi se istim gumbom, ponovnim dvoklikom na traku ili tipkom <kbd>Esc</kbd>.

Karta u bočnom stupcu se ne širi preko cijelog ekrana nego popuni svoj stupac, pa stranica pokraj nje ostaje u upotrebi.

## Tipke i geste

*Samo na računalu.*

| Tipka | Radnja |
|---|---|
| <kbd>K</kbd> | otvara i zatvara dijalog *Karte* |
| <kbd>Esc</kbd> | zatvara dijalog; ako je zatvoren, izlazi iz cijelog zaslona |
| <kbd>R</kbd> | ponovno učitava sve izdvojene karte |
| <kbd>G</kbd> | prikaz mreže (na ploči) |
| <kbd>S</kbd> | poravnavanje uz mrežu (na ploči) |
| strelice | pomiču prozor koji je na vrhu za jedno polje mreže |
| <kbd>Shift</kbd> + strelice | isto, ali za jedan piksel |

Strelice pomiču onaj prozor koji je posljednji podignut, dakle onaj koji je vidljivo iznad ostalih. Ako se pomaknuo krivi, kliknite na onaj koji ste htjeli i ponovite.

> **Tipke ne rade dok je fokus u interaktivnoj karti.** Kad kliknete u Windy ili Blitzortung, tipke prima ta karta, a ne stranica. Kliknite na naslovnu traku ili bilo gdje po stranici i tipke ponovno rade.

Geste na naslovnoj traci prozora:

| Gesta | Radnja |
|---|---|
| povlačenje | pomiče prozor |
| dvoklik | cijeli zaslon (interaktivne karte) ili vraćanje omjera (slike) |
| srednji klik | vraća kartu u stranicu; na ploči je miče s popisa |

## Što se pamti

Stranica pamti na tri različita načina i vrijedi znati koji je koji.

**1. Prikaz** — popis karata, njihov redoslijed i razmještaj prozora. Sprema se pritiskom na *Primijeni* i vraća se pri sljedećem otvaranju stranice. Ovo je ono što ide u spremljeni predložak i u poveznicu za dijeljenje.

**2. Samo ovaj preglednik** — položaj i veličina dijaloga, položaj i širina pločice *Karte*, te dva prekidača mreže. To se tiče ovog ekrana, a ne prikaza, pa **ne putuje** ni u predlošku ni u poveznici. Dvoklik na zaglavlje dijaloga vraća ga na zadano mjesto i veličinu.

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
