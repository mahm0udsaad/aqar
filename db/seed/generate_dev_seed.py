"""
Generates db/seed/dev_seed.sql: realistic TEST data for local development only.
Never run the output on production.

  python3 db/seed/generate_dev_seed.py
  psql -h 127.0.0.1 -p 54330 -U postgres -d aqar_local -f db/seed/dev_seed.sql
  # remove it again:
  psql ... -f db/seed/remove_dev_seed.sql

Everything it creates is marked so it can be removed cleanly:
users have emails ending in @test.aqar.local, listings have contact_email = 'seed@test.aqar.local'.
The local dev-login user regular-user@example.com also gets a few listings, messages and stats.
"""
import random
import uuid
from pathlib import Path

random.seed(20261116)
OUT = Path(__file__).with_name("dev_seed.sql")
MARK = "seed@test.aqar.local"

def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"

def uid():
    return str(uuid.UUID(int=random.getrandbits(128), version=4))

advertisers = [
    ("owner", "أحمد سمير", "+201001112233", None),
    ("owner", "منى عبد الرحمن", "+201112223344", None),
    ("owner", "محمد فؤاد", "+201223334455", None),
    ("owner", "سارة النجار", "+201554445566", None),
    ("broker", "كريم حسن", "+201005556677", "مكتب الإسكندرية للعقارات"),
    ("broker", "هالة مصطفى", "+201116667788", "بيت الساحل للتسويق العقاري"),
    ("broker", "طارق إبراهيم", "+201227778899", "التجمع هومز"),
]
buyers = ["عمر خالد", "ياسمين عادل", "مصطفى رمضان", "نورهان سعيد", "إسلام محمود", "رنا جمال"]

users = []  # (id, email, name, type, phone, office)
for i, (t, name, phone, office) in enumerate(advertisers):
    users.append((uid(), f"advertiser{i+1}@test.aqar.local", name, t, phone, office))
buyer_ids = []
for i, name in enumerate(buyers):
    b = (uid(), f"buyer{i+1}@test.aqar.local", name, None, None, None)
    users.append(b)
    buyer_ids.append(b[0])

# (governorate slug, city slug, city name ar, [(category slug, purpose, ppm or monthly-rent range, size range)])
places = [
    ("alexandria", "smouha", "سموحة", 26000, 34000),
    ("alexandria", "sidi-gaber", "سيدي جابر", 22000, 30000),
    ("alexandria", "gleem", "جليم", 30000, 42000),
    ("alexandria", "miami", "ميامي", 16000, 22000),
    ("alexandria", "agami", "العجمي", 11000, 16000),
    ("alexandria", "sporting", "سبورتنج", 20000, 27000),
    ("alexandria", "louran", "لوران", 24000, 32000),
    ("cairo", "new-cairo", "القاهرة الجديدة", 45000, 70000),
    ("cairo", "nasr-city", "مدينة نصر", 25000, 38000),
    ("cairo", "maadi", "المعادي", 35000, 55000),
    ("giza", "sheikh-zayed", "الشيخ زايد", 42000, 65000),
    ("giza", "6th-october", "6 أكتوبر", 25000, 40000),
    ("matrouh", "north-coast", "الساحل الشمالي", 60000, 110000),
    ("matrouh", "new-alamein", "العلمين الجديدة", 70000, 120000),
]
streets = ["شارع فوزي معاذ", "شارع الشهيد مصطفى حافظ", "طريق الحرية", "شارع 14 مايو", "كمبوند الريحانة", "كمبوند جاردينيا", "شارع التسعين",
           "محور جمال عبد الناصر", "شارع النصر", "كمبوند مارينا", "قرية سيدي عبد الرحمن", "شارع البحر"]
cat_images = {
    "apartments": ["property-1.jpg", "property-2.jpg", "property-3.jpg", "property-4.jpg", "property-6.jpg"],
    "villas": ["villa-1.jpg", "villa-2.jpg", "property-4.jpg"],
    "townhouses": ["villa-2.jpg", "villa-1.jpg", "property-4.jpg"],
    "penthouses": ["property-6.jpg", "property-3.jpg", "property-1.jpg"],
    "land": ["land-1.jpg", "hero-apartment-balcony.jpg", "villa-1.jpg"],
    "commercial": ["commercial-1.jpg", "property-2.jpg", "property-1.jpg"],
}
singular = {"apartments": "شقة", "villas": "فيلا", "townhouses": "تاون هاوس", "penthouses": "بنتهاوس", "land": "أرض", "commercial": "محل تجاري"}
size_range = {"apartments": (85, 220), "villas": (250, 600), "townhouses": (180, 320), "penthouses": (160, 320), "land": (300, 2000), "commercial": (40, 200)}
ppm_factor = {"apartments": 1.0, "villas": 1.2, "townhouses": 1.1, "penthouses": 1.15, "land": 0.35, "commercial": 1.4}
finishes = ["full", "full", "super_lux", "ultra_lux", "semi", "none", "furnished"]
descs = [
    "{cat} {purpose} في {place} بموقع مميز، قريبة من المدارس والمواصلات والخدمات. العمارة حديثة وبها أسانسير.",
    "{cat} واسعة {purpose} في {place}، إضاءة وتهوية ممتازة، إطلالة مفتوحة، وجراج خاص بالعمارة.",
    "فرصة {purpose}: {cat} في {place}، تشطيب ممتاز وجاهزة للسكن فوراً. المعاينة بموعد مسبق.",
    "{cat} {purpose} في {place}، المنطقة هادئة وآمنة، بالقرب من المولات والكافيهات والنوادي.",
]

listings = []  # dicts
def add_listing(owner_idx_or_email, place, cat, purpose, status="active", moderation="approved", rejection=None, owner_override=None):
    gov, city, city_ar, lo, hi = place
    smin, smax = size_range[cat]
    size = random.randrange(smin, smax, 5)
    beds = 0 if cat in ("land", "commercial") else random.choice([2, 3, 3, 3, 4, 5] if cat != "apartments" else [1, 2, 2, 3, 3, 3, 4])
    baths = 0 if cat == "land" else max(1, min(beds, random.choice([1, 2, 2, 3])))
    if purpose == "sale":
        ppm = random.randint(lo, hi) * ppm_factor[cat]
        price = int(round(ppm * size, -4))
    else:
        price = int(round(max(4000, (lo / 2600) * size * random.uniform(0.8, 1.3)), -2))
    days_ago = random.randint(1, 45)
    payment = None
    down = years = None
    if purpose == "sale":
        payment = random.choice(["cash", "cash", "installments", "both"])
        if payment != "cash":
            down = int(round(price * random.choice([0.1, 0.15, 0.2, 0.3]), -4))
            years = random.choice([3, 4, 5, 6, 7, 8])
    title = f"{singular[cat]} {'للبيع' if purpose == 'sale' else 'للإيجار'} في {city_ar} {size}م²"
    d = random.choice(descs).format(cat=singular[cat], purpose="للبيع" if purpose == "sale" else "للإيجار", place=city_ar)
    imgs = random.sample(cat_images[cat], k=min(len(cat_images[cat]), random.choice([3, 3, 4])))
    listings.append(dict(
        id=uid(), owner=owner_override, owner_idx=owner_idx_or_email, gov=gov, city=city, city_ar=city_ar, cat=cat,
        purpose=purpose, size=size, beds=beds, baths=baths, price=price, floor=random.randint(0, 12) if cat in ("apartments", "penthouses", "commercial") else None,
        finishing=random.choice(finishes) if cat != "land" else "none", payment=payment, down=down, years=years,
        title=title, desc=d, address=random.choice(streets), images=imgs, days_ago=days_ago,
        status=status, moderation=moderation, rejection=rejection, popularity=random.choice([0.3, 0.6, 1, 1, 1.5, 2.5]),
    ))

plan = []
for _ in range(40):
    place = random.choice(places)
    cat = random.choices(["apartments", "villas", "townhouses", "penthouses", "land", "commercial"], weights=[50, 12, 8, 6, 10, 8])[0]
    if place[0] == "matrouh" and cat in ("land", "commercial"):
        cat = "apartments"
    purpose = "rent" if (cat in ("apartments", "commercial") and random.random() < 0.3) else "sale"
    add_listing(random.randrange(len(advertisers)), place, cat, purpose)

# a few in other states so every tab and the review queue have something
for i, (st, mod, rej) in enumerate([
    ("active", "pending", None), ("active", "pending", None), ("active", "pending", None),
    ("active", "rejected", "الصور غير واضحة أو لا تخص العقار. أضف صوراً حقيقية للعقار."),
    ("inactive", "approved", None), ("sold", "approved", None), ("rented", "approved", None),
]):
    add_listing(random.randrange(len(advertisers)), random.choice(places), "apartments", "rent" if st == "rented" else "sale", st, mod, rej)

# listings for the local dev-login user so their dashboard has data
REGULAR = "regular-user@example.com"
add_listing(None, places[0], "apartments", "sale", owner_override=REGULAR)
add_listing(None, places[5], "apartments", "rent", owner_override=REGULAR)
add_listing(None, places[2], "penthouses", "sale", "active", "pending", owner_override=REGULAR)
for l in listings[-3:-1]:
    l["popularity"] = 2.0

sql = ["-- GENERATED by db/seed/generate_dev_seed.py. TEST DATA for local development only. Never run on production.", "BEGIN;"]
sql.append(Path(__file__).with_name("remove_dev_seed.sql").read_text().replace("BEGIN;", "").replace("COMMIT;", ""))

# users
for (i, email, name, t, phone, office) in users:
    created = random.randint(20, 120)
    sql.append(
        f"INSERT INTO user_profiles (id, email, full_name, phone, whatsapp, role, account_type, office_name, is_verified_broker, onboarded_at, created_at, updated_at) "
        f"VALUES ({q(i)}, {q(email)}, {q(name)}, {q(phone)}, {q(phone)}, 'user', {q(t)}, {q(office)}, {'true' if t == 'broker' else 'false'}, "
        f"{'now()' if t else 'NULL'}, now() - interval '{created} days', now());"
    )
# make sure the dev-login user exists and is set up as an owner
sql.append(
    f"INSERT INTO user_profiles (id, email, full_name, phone, whatsapp, role, account_type, onboarded_at, created_at, updated_at) "
    f"SELECT gen_random_uuid(), {q(REGULAR)}, 'regular-user', '+201012345678', '+201012345678', 'user', 'owner', now(), now() - interval '30 days', now() "
    f"WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE lower(email) = {q(REGULAR)});"
)
sql.append(f"UPDATE user_profiles SET account_type = COALESCE(account_type, 'owner'), phone = COALESCE(phone, '+201012345678'), whatsapp = COALESCE(whatsapp, phone, '+201012345678'), onboarded_at = COALESCE(onboarded_at, now()) WHERE lower(email) = {q(REGULAR)};")

def owner_sql(l):
    if l["owner"]:
        return f"(SELECT id FROM user_profiles WHERE lower(email) = {q(l['owner'])})"
    return q(users[l["owner_idx"]][0])

for l in listings:
    if l["owner"]:
        cname, cphone, otype = "regular-user", "+201012345678", "owner"
        owner_ref = owner_sql(l)
        cname_sql = f"COALESCE((SELECT full_name FROM user_profiles WHERE lower(email) = {q(l['owner'])}), 'regular-user')"
        cphone_sql = f"COALESCE((SELECT phone FROM user_profiles WHERE lower(email) = {q(l['owner'])}), '+201012345678')"
    else:
        u = users[l["owner_idx"]]
        otype = u[3]
        owner_ref = q(u[0])
        cname_sql = q(u[5] or u[2])
        cphone_sql = q(u[4])
    loc = f"(SELECT c.id FROM locations c JOIN locations g ON g.id = c.parent_id WHERE g.slug = {q(l['gov'])} AND c.slug = {q(l['city'])})"
    cat = f"(SELECT id FROM categories WHERE slug = {q(l['cat'])})"
    gov_ar = {"alexandria": "الإسكندرية", "cairo": "القاهرة", "giza": "الجيزة", "matrouh": "مطروح"}[l["gov"]]
    thumb = f"/images/{l['images'][0]}"
    published = "NULL" if l["moderation"] != "approved" else f"now() - interval '{l['days_ago']} days'"
    sold_at = f"now() - interval '{max(1, l['days_ago'] // 2)} days'" if l["status"] in ("sold", "rented") else "NULL"
    sql.append(
        "INSERT INTO properties (id, title, title_ar, description, description_ar, price, price_per_meter, location, location_ar, area, bedrooms, bathrooms, size, floor, "
        "category_id, property_type, owner_type, status, is_new, is_featured, is_verified, features, amenities, contact_name, contact_phone, contact_whatsapp, contact_email, "
        "thumbnail_url, owner_id, moderation_status, rejection_reason, finishing, payment_type, down_payment, installment_years, location_id, submitted_at, reviewed_at, published_at, sold_at, created_at, updated_at) VALUES ("
        f"{q(l['id'])}, {q(l['title'])}, {q(l['title'])}, {q(l['desc'])}, {q(l['desc'])}, {l['price']}, {round(l['price'] / l['size'])}, {q(l['address'])}, "
        f"{q(l['address'] + '، ' + l['city_ar'] + '، ' + gov_ar)}, {q(l['city_ar'])}, {l['beds']}, {l['baths']}, {l['size']}, {l['floor'] if l['floor'] is not None else 'NULL'}, "
        f"{cat}, '{l['purpose']}', '{otype}', '{l['status']}', false, false, false, '{{}}', '{{}}', {cname_sql}, {cphone_sql}, {cphone_sql}, {q(MARK)}, "
        f"{q(thumb)}, {owner_ref}, '{l['moderation']}', {q(l['rejection'])}, {q(l['finishing'])}, {q(l['payment'])}, {l['down'] if l['down'] else 'NULL'}, {l['years'] if l['years'] else 'NULL'}, "
        f"{loc}, now() - interval '{l['days_ago']} days', {('now()' if l['moderation'] != 'pending' else 'NULL')}, {published}, {sold_at}, now() - interval '{l['days_ago']} days', now());"
    )
    for i, img in enumerate(l["images"]):
        sql.append(
            f"INSERT INTO property_images (property_id, url, thumbnail_url, alt_text, order_index, is_main) VALUES ({q(l['id'])}, {q('/images/' + img)}, {q('/images/' + img)}, {q(l['title'])}, {i}, {'true' if i == 0 else 'false'});"
        )

# events over the last 30 days for approved listings (views drive everything else)
for l in listings:
    if l["moderation"] != "approved":
        continue
    days = min(30, l["days_ago"])
    views = int(random.randint(15, 90) * l["popularity"] * days / 30) + 2
    for kind, share in (("view", 1.0), ("whatsapp", 0.07), ("call", 0.03), ("phone_reveal", 0.05), ("share", 0.02)):
        n = max(0, int(round(views * share * random.uniform(0.6, 1.4))))
        if n:
            sql.append(
                f"INSERT INTO listing_events (property_id, kind, created_at) SELECT {q(l['id'])}, '{kind}', now() - (random() * {days}) * interval '1 day' FROM generate_series(1, {n});"
            )

# favorites by test buyers (and matching events)
approved = [l for l in listings if l["moderation"] == "approved" and l["status"] == "active"]
for b in buyer_ids:
    for l in random.sample(approved, k=random.randint(2, 6)):
        sql.append(f"INSERT INTO loved_properties (user_id, property_id, created_at) VALUES ({q(b)}, {q(l['id'])}, now() - interval '{random.randint(0, 20)} days') ON CONFLICT DO NOTHING;")
        sql.append(f"INSERT INTO listing_events (property_id, kind, created_at) VALUES ({q(l['id'])}, 'favorite', now() - interval '{random.randint(0, 20)} days');")

# conversations: buyers ask, advertisers answer (some left unread for the advertiser)
openers = ["السلام عليكم، هل العقار ما زال متاحاً؟", "هل السعر قابل للتفاوض؟", "أريد معاينة العقار، ما المواعيد المناسبة؟", "هل يوجد جراج وأسانسير؟"]
replies = ["وعليكم السلام، نعم متاح.", "ممكن نتفاهم بعد المعاينة.", "متاح يوم الخميس بعد العصر.", "نعم يوجد جراج وأسانسير."]
regular_listings = [l for l in listings if l["owner"] == REGULAR and l["moderation"] == "approved"]
targets = random.sample([l for l in approved if not l["owner"]], k=8) + regular_listings
for n, l in enumerate(targets):
    b = random.choice(buyer_ids)
    cid = uid()
    start_h = random.randint(10, 200)
    unread_for_owner = n % 3 == 0 or l["owner"] == REGULAR
    sql.append(
        f"INSERT INTO conversations (id, property_id, buyer_id, owner_id, created_at, last_message_at, buyer_last_read_at, owner_last_read_at) "
        f"SELECT {q(cid)}, {q(l['id'])}, {q(b)}, owner_id, now() - interval '{start_h} hours', now() - interval '{start_h - 2} hours', now(), "
        f"{('now() - interval ' + q(str(start_h + 1) + ' hours')) if unread_for_owner else 'now()'} FROM properties WHERE id = {q(l['id'])} ON CONFLICT DO NOTHING;"
    )
    sql.append(f"INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES ({q(cid)}, {q(b)}, {q(random.choice(openers))}, now() - interval '{start_h} hours');")
    sql.append(f"INSERT INTO listing_events (property_id, kind, created_at) VALUES ({q(l['id'])}, 'message', now() - interval '{start_h} hours');")
    if not unread_for_owner:
        sql.append(f"INSERT INTO messages (conversation_id, sender_id, body, created_at) SELECT {q(cid)}, owner_id, {q(random.choice(replies))}, now() - interval '{start_h - 1} hours' FROM properties WHERE id = {q(l['id'])};")
        sql.append(f"INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES ({q(cid)}, {q(b)}, 'تمام، شكراً جزيلاً', now() - interval '{start_h - 2} hours');")

# one visitor report so the reports page has an example
sql.append(f"INSERT INTO listing_reports (property_id, reporter_id, reason, details) VALUES ({q(approved[3]['id'])}, {q(buyer_ids[0])}, 'wrong_price', 'السعر في الإعلان مختلف عن السعر الذي قاله المعلن في التليفون.');")

# counters on the listing rows follow the events
sql.append(
    f"""UPDATE properties p SET
      views = (SELECT count(*) FROM listing_events e WHERE e.property_id = p.id AND e.kind = 'view'),
      whatsapp_clicks = (SELECT count(*) FROM listing_events e WHERE e.property_id = p.id AND e.kind = 'whatsapp'),
      call_clicks = (SELECT count(*) FROM listing_events e WHERE e.property_id = p.id AND e.kind IN ('call', 'phone_reveal'))
    WHERE p.contact_email = {q(MARK)};"""
)
sql.append("COMMIT;")
OUT.write_text("\n".join(sql) + "\n")
print(f"wrote {OUT} ({len(listings)} listings, {len(users)} users)")
