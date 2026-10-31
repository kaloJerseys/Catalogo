from pathlib import Path
import json, re, unicodedata
from datetime import date
from catalog_io import read_catalog,write_catalog

ROOT=Path(__file__).resolve().parents[1]
def norm(text):
    return ''.join(c for c in unicodedata.normalize('NFD',text.lower()) if unicodedata.category(c)!='Mn')

GROUPS={
'Fútbol':{
'Real Madrid':['r mad','real madrid'], 'FC Barcelona':['bar','barcelona'], 'Atlético de Madrid':['a mad','atletico madrid'], 'Real Betis':['bts','real betis'],
'Manchester United':['mnu','manchester united','man united'], 'Manchester City':['mci','manchester city'], 'Liverpool':['lll','liverpool'], 'Arsenal':['asn','arsenal'], 'Chelsea':['che','chelsea'], 'Tottenham':['tot','tottenham'],
'PSG':['psg','paris saint'], 'AC Milan':['acm','ac milan'], 'Inter de Milán':['inter milan','inter milano'], 'Juventus':['juv','juventus'], 'Bayern Múnich':['bayern','munchen'], 'Borussia Dortmund':['dortmund'],
'Sporting CP':['sporting cp','lisbon'], 'Athletic Club':['athletic bilbao','athletic club','bilbao'], 'Peñarol':['penarol','pearol'],
'Brasil':['brazil','brasil'], 'Alemania':['germany'], 'España':['spain'], 'Francia':['france'], 'Inglaterra':['england'], 'Italia':['italy'], 'Países Bajos':['netherlands','holland'], 'Japón':['japan'], 'México':['mexico'], 'Estados Unidos':['usa','united states'],
'Corea del Sur':['south korea','korea'], 'Sudáfrica':['south africa'], 'Costa de Marfil':['cote d ivoire','ivory coast'], 'Camerún':['cameroon'], 'Marruecos':['morocco'], 'Bélgica':['belgium'], 'Croacia':['croatia'], 'Suecia':['sweden'], 'Noruega':['norway'], 'Australia':['australia'], 'Canadá':['canada'], 'Turquía':['turkey','turkiye'], 'Grecia':['greece'], 'Suiza':['swizland','switzerland'], 'Argelia':['algeria'], 'Irlanda':['ireland'], 'Escocia':['scotland'], 'Gales':['wales'], 'Rusia':['soviet union','russia'],
'Inter Miami':['inter miami','miami international'], 'Boca Juniors':['boca junior'], 'River Plate':['river plate'], 'Universidad de Chile':['universidad de chile','university of chile'], 'Universidad Católica':['universidad catolica','la catolica'], 'Colo-Colo':['colo colo','colo-colo'], 'São Paulo':['sao paulo'], 'Grêmio':['gremio'], 'Atlético Mineiro':['atletico mineiro'],
'Club América':['club america','america'], 'Chivas':['chivas','guadalajara'], 'Al-Nassr':['al-nassr','al nassr'], 'Al-Hilal':['al-hilal','al hilal'], 'Al-Ittihad':['ittihad'],
'Argentina':['argentina'], 'Uruguay':['uruguay'], 'Colombia':['colombia','columbia'], 'Panamá':['panama'], 'Chile':['chile'], 'Perú':['peru'], 'Costa Rica':['costa rica'], 'Portugal':['portugal'], 'Ecuador':['ecuador'], 'Paraguay':['paraguay'], 'Venezuela':['venezuela'], 'Bolivia':['bolivia'], 'Senegal':['senegal'], 'Nigeria':['nigeria'], 'Jamaica':['jamaica'], 'Haití':['haiti'], 'Curazao':['curacao'], 'Bosnia y Herzegovina':['bosnia'], 'Túnez':['tunisia']},
'NBA':{name:[name.split(' ')[-1].lower(),name.lower()] for name in ['Los Angeles Lakers','Boston Celtics','Chicago Bulls','Golden State Warriors','Miami Heat','Dallas Mavericks','Oklahoma City Thunder','Brooklyn Nets','New York Knicks','Denver Nuggets','Phoenix Suns','San Antonio Spurs','Milwaukee Bucks','Philadelphia 76ers','Toronto Raptors','Houston Rockets','Cleveland Cavaliers','Minnesota Timberwolves','Sacramento Kings','Memphis Grizzlies','Detroit Pistons','Indiana Pacers','Orlando Magic','Atlanta Hawks','Washington Wizards','Charlotte Hornets','New Orleans Pelicans','Portland Trail Blazers','Los Angeles Clippers','Utah Jazz']},
'NFL':{name:[name.lower(),name.split(' ')[-1].lower()] for name in ['Kansas City Chiefs','Dallas Cowboys','San Francisco 49ers','New England Patriots','Green Bay Packers','Philadelphia Eagles','Las Vegas Raiders','Miami Dolphins','Buffalo Bills','Baltimore Ravens','Chicago Bears','Pittsburgh Steelers','New York Jets','New York Giants','Los Angeles Rams','Los Angeles Chargers','Cincinnati Bengals','Denver Broncos','Detroit Lions','Seattle Seahawks','Minnesota Vikings','New Orleans Saints','Tampa Bay Buccaneers','Tennessee Titans','Jacksonville Jaguars','Carolina Panthers','Houston Texans','Atlanta Falcons','Cleveland Browns','Arizona Cardinals','Washington Commanders','Indianapolis Colts']},
'F1':{'Ferrari':['ferrari'], 'McLaren':['mclaren'], 'Red Bull Racing':['red bull'], 'Mercedes':['mercedes'], 'Aston Martin':['aston martin'], 'Alpine':['alpine'], 'Williams Racing':['williams racing'], 'Haas':['haas'], 'Audi':['audi f1'], 'Cadillac':['cadillac']}}

MORE_TEAMS='Trabzonspor|SC Braga|Como 1907|FC Cartagena|Schalke 04|Albacete|Dinamo Bucuresti|Augsburg|Hull City|FC Utrecht|AEK Athens|Real Murcia|Vitoria de Guimaraes|Dynamo Dresden|Lecce|Stade Brestois|FC Alverca|Olympiacos|Besiktas|Sampdoria|Atlante|FC Motagua|Nürnberg|Cultural Leonesa|Almería|Burnley|West Bromwich Albion|Crystal Palace|Coventry City|Watford|VfB Stuttgart|Stoke City|Fulham|Villarreal|Huesca|Bristol City|San Lorenzo|Paysandu|SSC Bari|AFC Richmond|Middlesbrough|Sunderland|Swansea City|Sheffield United|Sheffield Wednesday|Southampton|Blackburn Rovers|Leeds United|Norwich City|Cork City|Girona|Freiburg|St Pauli|Espérance de Tunis|Luton Town|Ipswich Town|Preston North End|Derby County|Blackpool|Cardiff City|Birmingham City|Wrexham|Hamburg|Hannover|Kaiserslautern|FC Köln|Heidenheim|Bologna|Genoa|Spezia|Salernitana|Monza|Empoli|Vélez Sarsfield|San Diego FC|Atlas|Real Oviedo|Levante|Getafe|Eibar|FC Basel|Young Boys|BSC Young Boys|FC Copenhagen|Brøndby|Anderlecht|Club Brugge|Standard Liège|Genk|Shakhtar Donetsk|Dynamo Kyiv|Sparta Prague|Slavia Prague|Viktoria Plzeň|Dundee|Aberdeen|Heart of Midlothian|Hibernian|Burgos|Santander|Sporting de Gijón|Portsmouth|Reading|QPR|Plymouth Argyle|Millwall|Stade Reims|Metz|Montpellier|Nantes|Nice|Brest|Le Havre|Auxerre|Lorient|Toulouse|Angers|Saint-Etienne|Deportivo Saprissa|Alajuelense|Herediano|Municipal|Comunicaciones|Guatemala|El Salvador|Honduras|Mali|Ghana|Bulgaria|Slovenia|Slovakia|Romania|Hungary|Poland|Denmark|Iraq|Iran|Saudi Arabia|Uzbekistan|China|Vietnam|Indonesia|Thailand|Malaysia|Singapore|India|Pakistan|Bangladesh|Nepal|Kosovo|Albania|Serbia|Yugoslavia|Czech Republic|Ukraine|Georgia|Iceland|Finland|Austria|New Zealand|Northern Ireland|Zambia|Zimbabwe|Uganda|Kenya|Congo|Angola|Gabon|Madagascar|Benin|Burkina Faso|Cape Verde|Equatorial Guinea'
for name in MORE_TEAMS.split('|'): GROUPS['Fútbol'].setdefault(name,[norm(name)])
EXTRA_ALIASES={
 'Real Madrid':['r madrid','r amd','rma','rmad'], 'FC Barcelona':['fcb','barca'], 'Inter de Milán':['int','inter'], 'PSG':['paris'], 'Napoli':['naples'], 'Francia':['frence','french'], 'Alemania':['german'], 'Portugal':['portgual'], 'Manchester City':['man city'], 'Manchester United':['man u','man utd','manchester utd'], 'Real Betis':['betis'], 'Athletic Club':['bil'], 'Real Sociedad':['sad'], 'Deportivo de La Coruña':['deportivo de la coruna','deportivo de la corua','dep'], 'São Paulo':['san paul'], 'Boca Juniors':['boca'], 'LA Galaxy':['galaxy'], 'Palestino':['cd palestino','palestino'], 'SC Braga':['s.c. braga','braga'], 'Tigres UANL':['tigres de la uanl','tigres'], 'Villarreal':['villarreal'], 'Blackburn Rovers':['blackburn'], 'Coventry City':['coventry'], 'West Bromwich Albion':['west bromwich'], 'Sporting de Gijón':['sporting gijon','sporting de gijon'], 'Freiburg':['sc freiburg'], 'Bayer Leverkusen':['leverkusen'], 'Werder Bremen':['werder bremen'], 'Borussia Mönchengladbach':['monchengladbach','borussia'], 'Estados Unidos':['us'], 'Canadá':['canadian']}
for name,names in EXTRA_ALIASES.items(): GROUPS['Fútbol'].setdefault(name,[]).extend(names)
GROUPS['F1']['McLaren'].extend(['maclaren','mclaren f1'])
SPANISH_COUNTRIES={'Slovenia':'Eslovenia','Slovakia':'Eslovaquia','Romania':'Rumanía','Hungary':'Hungría','Poland':'Polonia','Denmark':'Dinamarca','Iraq':'Irak','Iran':'Irán','Saudi Arabia':'Arabia Saudita','China':'China','Thailand':'Tailandia','Czech Republic':'República Checa','Ukraine':'Ucrania','Georgia':'Georgia','Iceland':'Islandia','Finland':'Finlandia','Austria':'Austria','New Zealand':'Nueva Zelanda','Northern Ireland':'Irlanda del Norte','Cape Verde':'Cabo Verde','Equatorial Guinea':'Guinea Ecuatorial','Ghana':'Ghana','Bulgaria':'Bulgaria','Yugoslavia':'Yugoslavia','Serbia':'Serbia','India':'India','Gabon':'Gabón','Kenya':'Kenia','Madagascar':'Madagascar','Albania':'Albania','Indonesia':'Indonesia','Malaysia':'Malasia','Singapore':'Singapur','Pakistan':'Pakistán','Uzbekistan':'Uzbekistán'}
PLAYERS={
 'Fútbol':{'Lionel Messi':['messi'],'Cristiano Ronaldo':['cristiano','ronaldo'],'Ronaldinho':['ronaldinho'],'Neymar':['neymar'],'Kylian Mbappé':['mbappe'],'Erling Haaland':['haaland'],'Jude Bellingham':['bellingham'],'Vinícius Jr.':['vinicius'],'Lamine Yamal':['yamal'],'Mohamed Salah':['salah'],'Harry Kane':['kane'],'Cole Palmer':['palmer'],'Bukayo Saka':['saka'],'Luka Modrić':['modric'],'Zinedine Zidane':['zidane'],'David Beckham':['beckham'],'Diego Maradona':['maradona'],'Pelé':['pele'],'Ricardo Kaká':['kaka'],'Luis Suárez':['suarez'],'Gianluigi Buffon':['buffon'],'Steven Gerrard':['gerrard'],'Wayne Rooney':['rooney'],'Didier Drogba':['drogba'],'Francesco Totti':['totti'],'Paolo Maldini':['maldini'],'Frank Lampard':['lampard'],'Robert Lewandowski':['lewandowski']},
 'NBA':{'LeBron James':['lebron','james'],'Kobe Bryant':['kobe','bryant'],'Michael Jordan':['michael jordan','jordan'],'Stephen Curry':['stephen curry','curry'],'Kevin Durant':['durant'],'Luka Dončić':['doncic'],'Giannis Antetokounmpo':['antetokounmpo','giannis'],'Jayson Tatum':['tatum'],'Jaylen Brown':['jaylen brown'],'Anthony Edwards':['edwards'],'Victor Wembanyama':['wembanyama'],'Allen Iverson':['iverson'],'Shaquille O’Neal':['shaquille','o neal','oneal'],'Dwyane Wade':['wade'],'Magic Johnson':['magic johnson'],'Larry Bird':['larry bird','bird'],'Vince Carter':['vince carter','carter'],'Steve Nash':['steve nash','nash'],'Derrick Rose':['derrick rose','rose'],'Tracy McGrady':['mcgrady'],'Ja Morant':['morant'],'Shai Gilgeous-Alexander':['gilgeous','shai'],'Chet Holmgren':['holmgren'],'Paul George':['paul george','george']}}

PLAYERS['Fútbol']['Cristiano Ronaldo']=['cristiano']
PLAYERS['Fútbol']['Ronaldo']=['ronaldo']

def main():
    from refine_catalog import refine
    raw=json.loads((ROOT/'tools/catalog-raw.json').read_text('utf-8'))
    image_map=json.loads((ROOT/'tools/image-map.json').read_text('utf-8')) if (ROOT/'tools/image-map.json').exists() else {}
    # Nombres de clubes conservados del menú público del proveedor.
    for c in raw['categories']:
        label=re.sub(r'[^\w\s.À-ÿ-]','',re.split(r'[\u3400-\u9fff]',c['label'])[0]).strip()
        if label and not any(w in norm(label) for w in ['league','liga ','version','jersey','shirt','kids','retro','training','products','contact','shorts','backpack','other','suit','windbreaker','sport','nba','nfl','f1','casual','carmel','hoodie','album','goalkeeper']):
            if not any(norm(label) in aliases for aliases in GROUPS['Fútbol'].values()): GROUPS['Fútbol'].setdefault(label,[norm(label)])
    aliases=[]
    for sport, teams in GROUPS.items():
        for team, names in teams.items():
            for alias in [team]+names:
                aliases.append((norm(alias),SPANISH_COUNTRIES.get(team,team),sport))
    aliases.sort(key=lambda a:len(a[0]),reverse=True)
    compiled=[(re.compile(r'(?<![a-z0-9])'+re.escape(alias)+r'(?![a-z0-9])'),team,sport) for alias,team,sport in aliases]
    colors={'dark blue':'Azul oscuro','navy blue':'Azul marino','light blue':'Celeste','sky blue':'Celeste','blue':'Azul','black':'Negro','white':'Blanco','red':'Rojo','green':'Verde','yellow':'Amarillo','pink':'Rosado','purple':'Morado','orange':'Naranja','gray':'Gris','grey':'Gris','beige':'Beige','gold':'Dorado','brown':'Marrón'}
    seen=set(); products=[]
    for page in sorted(raw['pages'],key=int):
        for item in raw['pages'][page]:
            if item['id'] in seen: continue
            seen.add(item['id']); text=norm(item['original']); padded=' '+text+' '
            team='Colección deportiva'; sport='Fútbol'
            for pattern,name,s in compiled:
                if pattern.search(padded): team=name; sport=s; break
            if re.search(r'\bnba\b|basketball|basket ball',text): sport='NBA'
            elif re.search(r'\bnfl\b|american football',text): sport='NFL'
            elif re.search(r'\bf1\b|formula 1',text): sport='F1'
            elif re.search(r'baseball|mlb|yankees|dodgers',text): sport='Otros deportes'
            elif 'cricket' in text: sport='Otros deportes'
            elif 'rugby' in text or 'all blacks' in text: sport='Otros deportes'; team='All Blacks' if 'all blacks' in text else team
            if team=='Colección deportiva' and sport!='Fútbol': team={'NBA':'Colección NBA','NFL':'Colección NFL','F1':'Colección F1'}.get(sport,'Colección deportiva')
            audience='Infantil' if re.search(r'kid|child|boy|girl|baby|infant',text) else ('Mujer' if re.search(r'wom[ae]n|ladies|female',text) else 'Adulto')
            category='Camisetas'
            if re.search(r'socks|backpack|bag\b|cap\b|hat\b|scarf|glove|ball\b|keychain|accessor',text): category='Accesorios'
            if re.search(r'\bshorts?\b|\bpants?\b|trouser',text): category='Pantalones y shorts'
            if 'polo' in text: category='Polos'
            if re.search(r'jacket|windbreaker|coat\b',text): category='Chaquetas'
            if re.search(r'hoodie|sweatshirt',text): category='Sudaderas'
            if re.search(r'suit|tracksuit|track suit|set\b|kid.*kit|kit.*kid',text): category='Conjuntos'
            isretro=bool(re.search(r'retro|vintage|bringback',text))
            version='Jugador' if re.search(r'player|authentic',text) else ('Retro' if isretro else 'Estándar')
            year=re.search(r'(?<!\d)(?:19|20)\d{2}(?:[/*-]\d{2,4})?(?!\d)',text)
            shortyear=re.search(r'(?<!\d)(\d{2})[/-](\d{2})(?!\d)',text) if not year else None
            season=year[0].replace('-','/').replace('*','/') if year else 'Sin temporada'
            if shortyear:
                a,b=shortyear.groups()
                if int(b)==(int(a)+1)%100: season=('19' if int(a)>40 else '20')+a+'/'+b
            if '/' in season: season=season.split('/')[0]+'/'+season.split('/')[1][-2:]
            # El año de fundación de un club no es la temporada de una prenda.
            if team=='Como 1907':
                actual=re.search(r'20\d{2}(?:[/-]\d{2,4})?',text)
                if actual: season=actual[0].replace('-','/')
            details=[]
            for player,aliases_player in PLAYERS.get(sport,{}).items():
                if any(re.search(r'(?<![a-z])'+re.escape(a)+r'(?![a-z])',text) for a in aliases_player):
                    details.append(player);break
            number=re.search(r'(?:\bno\.?|\bnumber|#)\s*(\d{1,3})\b',text)
            if number:details.append('N.º '+number[1])
            if 'third' in text or 'fourth' in text: details.append('Tercera equipación' if 'third' in text else 'Cuarta equipación')
            elif 'away' in text: details.append('Visitante')
            elif 'home' in text: details.append('Local')
            if 'goalkeeper' in text or re.search(r'\bgk\b',text): details.append('Portero')
            if re.search(r'pre.?match',text): details.append('Prepartido')
            elif 'training' in text: details.append('Entrenamiento')
            if re.search(r'special|speical|spacial|edition|concept|commemorative|anniversary',text): details.append('Edición especial')
            if 'long sleeve' in text or 'long sleeves' in text: details.append('Manga larga')
            if 'crop' in text: details.append('Corte corto')
            found=[]; remaining=text
            for color,spanish in colors.items():
                if re.search(r'\b'+color+r'\b',remaining): found.append(spanish); remaining=re.sub(r'\b'+color+r'\b','',remaining)
            if found: details.append(' / '.join(found))
            if isretro and 'Retro' not in details: details.insert(0,'Retro')
            sizes=[]
            size=re.search(r'\b(XXS|XS|S|M|L|XL|XXL|[2-5]XL)\s*-\s*(XXS|XS|S|M|L|XL|XXL|[2-5]XL)\b',item['original'],re.I)
            if size:
                order=['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL']; a,b=[x.upper().replace('XXL','2XL') for x in size.groups()]
                if a in order and b in order: sizes=order[order.index(a):order.index(b)+1]
            elif re.search(r'16\s*-\s*28',text): sizes=['16','18','20','22','24','26','28']
            elif re.search(r'9 and 12',text): sizes=['9 meses','12 meses']
            if team=='Colección deportiva':
                cleaned=re.sub(r'[\u3400-\u9fff]','',item['original'])
                cleaned=re.sub(r'(?i)\b(?:19|20)?\d{2}(?:[/*-]\d{2,4})?\b',' ',cleaned)
                cleaned=re.sub(r'(?i)^\s*(?:retro|mens?|womens?|kids?|baby|adult|player|version)\b[\s\'s]*','',cleaned).strip(' -_/')
                cleaned=re.sub(r'(?i)\b(?:retro|mens|men|women|womens|woman|kid|kids|baby|adult|version|player|new|season|home|away|third|fourth|soccer|jerseys?|t-shirt|shirts?|training|kit|suit|windbreaker|jacket|hoodie|shorts|pants|polo|special|edition|size|black|white|blue|red|green|yellow|pink|purple|orange|gray|grey|dark|light|navy|long|sleeves?|with|sponsors?|cheap|yupoo)\b.*',' ',cleaned).strip()
                if 2<len(cleaned)<55 and not re.fullmatch(r'[\d\s#./-]+',cleaned): team=cleaned
            products.append({'id':item['id'],'name':team+((' '+season) if season!='Sin temporada' else ''),'team':team,'sport':sport,'category':category,'audience':audience,'version':version,'season':season,'detail':' · '.join(details) or category,'sizes':sizes,'image':image_map.get(item.get('image'),'./assets/image-unavailable.svg'),'original':item['original']})
    products=[refine(p) for p in products]
    out=ROOT/'data';out.mkdir(exist_ok=True)
    from curate_catalog import curate
    previous=read_catalog(out/'catalog.js') if (out/'catalog.js').exists() else {}
    catalog,_,_=curate({'updated':raw.get('updated',previous.get('updated',str(date.today()))),'pages':len(raw['pages']),'total':len(products),'products':products},raw)
    write_catalog(out/'catalog.js',catalog)
    print(json.dumps({'products':len(catalog['products']),'internalReferences':catalog['excludedInformational'],'pages':len(raw['pages']),'sports':{s:sum(p['sport']==s for p in catalog['products']) for s in sorted(set(p['sport'] for p in catalog['products']))},'unclassified':sum(p['teamStatus']=='unclassified' for p in catalog['products'])},ensure_ascii=False))

if __name__=='__main__': main()
