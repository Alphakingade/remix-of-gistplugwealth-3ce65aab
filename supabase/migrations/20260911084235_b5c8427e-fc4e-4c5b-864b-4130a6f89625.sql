INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Making Money in Nigeria', 'making-money-in-nigeria', 'Realistic ways to earn extra income in Nigeria, online and offline.', 'hand-coins', 1),
  ('Saving Money', 'saving-money', 'Practical habits and tools that help your naira go further.', 'piggy-bank', 2),
  ('Student Finance', 'student-finance', 'Money guides for Nigerian students and fresh graduates.', 'graduation-cap', 3),
  ('Apps', 'apps', 'Reviews and how-tos for banking, saving and earning apps.', 'smartphone', 4),
  ('Online Business', 'online-business', 'Starting and growing a small online business from Nigeria.', 'store', 5),
  ('Personal Finance', 'personal-finance', 'Budgeting, emergency funds, debt and everyday money decisions.', 'wallet', 6),
  ('Resources', 'resources', 'Checklists, templates and tools we recommend.', 'library', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES
  ('Side Hustles', 'side-hustles'),
  ('Budgeting', 'budgeting'),
  ('Savings', 'savings'),
  ('Freelancing', 'freelancing'),
  ('Students', 'students'),
  ('Apps', 'apps'),
  ('Small Business', 'small-business'),
  ('Beginners', 'beginners')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_url', ''),
  ('contact_email', 'hello@gistplugwealth.com'),
  ('twitter_url', ''),
  ('facebook_url', ''),
  ('instagram_url', ''),
  ('tiktok_url', ''),
  ('youtube_url', '')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.articles (title, slug, excerpt, content, category_id, status, featured, popular, trending, read_minutes, seo_title, seo_description, published_at)
VALUES
(
  'How to Start a Side Hustle in Nigeria With Little or No Capital',
  'start-a-side-hustle-in-nigeria-with-little-capital',
  'A step-by-step way to pick a side hustle you can actually start this month, using skills and tools you already have.',
  '## Start with what you already have

Most people delay a side hustle because they are waiting for capital. A better first question is: **what can I already do that someone would pay for?** Writing, tutoring, hairstyling, baking, phone repairs, running errands, designing flyers, managing a small business page — all of these start with skill, not money.

## Pick one idea, not five

Write down every skill you have. Then keep only the ones that pass these three tests:

- Someone near you (or online) already pays for it.
- You can deliver it with the phone, laptop or tools you own today.
- You can do it around your job or school without burning out.

## Test before you invest

Offer the service to five people at a friendly starting price. Your goal is not profit yet — it is proof. **If nobody pays, the idea is not ready; if people pay, you now know what to improve.**

## Charge properly from the beginning

Add up what the job actually costs you: transport, data, materials, and your time. Price above that. Working for free "to build trust" usually just builds resentment.

## Keep the money separate

Open a separate account or savings pocket for the hustle. Money that mixes with your personal spending disappears quietly, and you never find out whether the business works.

## Grow slowly, deliberately

Reinvest a fixed share of every payment into the tools that remove your biggest bottleneck. Raise prices as your work and reviews improve.

**The point is not to find a secret opportunity. It is to start small, get paid, and improve in public.**',
  (SELECT id FROM public.categories WHERE slug = 'making-money-in-nigeria'),
  'published', true, true, true, 6,
  'How to Start a Side Hustle in Nigeria With Little Capital',
  'A practical, step-by-step guide to choosing, testing and pricing a side hustle in Nigeria without needing big capital.',
  now()
),
(
  'A Simple Monthly Budget That Works on a Nigerian Salary',
  'simple-monthly-budget-nigerian-salary',
  'Budgeting fails when it is complicated. Here is a plain method you can run on paper or a notes app.',
  '## Why most budgets fail

They are too detailed, and they ignore how money actually arrives and leaves. A budget you can keep for six months beats a perfect budget you abandon in two weeks.

## Step 1: Write down the money you can count on

Use only income you are confident about. Extra gigs and bonuses are a bonus, not a plan.

## Step 2: List your fixed bills first

Rent, transport, data, electricity, school fees, loan repayments. **These are non-negotiable, so they come out before anything else.**

## Step 3: Give the rest a job

Split what remains into three simple pockets:

- **Living** — food, toiletries, household needs.
- **Saving** — emergency fund first, goals second.
- **Flexible** — outings, gifts, clothes, the things that make life enjoyable.

## Step 4: Automate the saving

Move your savings the same day your salary lands, not at month end. Whatever is left at month end is usually nothing.

## Step 5: Review once a month

Ask two questions: where did I go over, and was it worth it? Adjust the pockets instead of blaming yourself.

**A budget is not a punishment. It is a decision made in advance so you stop deciding under pressure.**',
  (SELECT id FROM public.categories WHERE slug = 'personal-finance'),
  'published', true, true, false, 5,
  'A Simple Monthly Budget That Works on a Nigerian Salary',
  'A plain, repeatable monthly budgeting method for Nigerian earners, with fixed bills, savings automation and a monthly review.',
  now() - interval '2 days'
),
(
  'How to Build an Emergency Fund When Prices Keep Rising',
  'build-an-emergency-fund-nigeria',
  'What an emergency fund is for, how much to aim at, and how to keep it growing when everything is more expensive.',
  '## What it is actually for

An emergency fund covers the shocks that would otherwise push you into borrowing: a health bill, a sudden repair, a lost job, urgent travel. **It is not a savings goal for a new phone.**

## How much to aim at

Start with one month of essential expenses — rent share, food, transport, data, medication. Once that is in place, build towards three months. Essentials only; this is a survival number, not a lifestyle number.

## Where to keep it

Somewhere boring and reachable within a day or two. Not in cash at home, not locked away for a year, and not invested in anything whose value can fall the week you need it.

## How to grow it when money is tight

- Save on the day money arrives, before spending starts.
- Add every irregular inflow: refunds, gifts, side-hustle payments.
- Increase the amount whenever your income rises, before your spending adjusts.

## Rules for using it

Write down what counts as an emergency, and refill the fund immediately after you use it. **The fund only works if it is allowed to be used — and rebuilt.**',
  (SELECT id FROM public.categories WHERE slug = 'saving-money'),
  'published', false, true, true, 5,
  'How to Build an Emergency Fund in Nigeria',
  'How much to keep in an emergency fund, where to keep it, and how to grow it steadily when prices keep rising.',
  now() - interval '4 days'
),
(
  'Money Guide for Nigerian Students: Handling Allowance, Fees and Small Business',
  'money-guide-for-nigerian-students',
  'How students can stretch an allowance, avoid common money traps and earn on campus without hurting their grades.',
  '## Plan the allowance the day it lands

Divide it into weeks before you spend anything. A month feels vague; a week is easy to track. **Whatever is meant for week four should not be reachable in week one.**

## Protect the non-negotiables

Transport, data, food and printing come first. If these run out mid-month, everything becomes a borrowing decision.

## Earn without wrecking your grades

Campus-friendly options are usually skills, not shops: tutoring, typing and design work, laundry services, sales for a small brand, running social pages, photography. Choose work you can pause during exams.

## Avoid the traps

- Borrowing to look wealthy on social media.
- "Double your money" schemes, whatever the story or the referral.
- Buying tools before you have a single paying customer.

## Start saving on small money

The habit matters more than the amount now. **A student who saves consistently from a small allowance becomes an adult who saves from a salary.**',
  (SELECT id FROM public.categories WHERE slug = 'student-finance'),
  'published', false, false, true, 5,
  'Money Guide for Nigerian Students',
  'Practical money advice for Nigerian students: managing allowance, avoiding scams, earning on campus and building savings habits.',
  now() - interval '6 days'
),
(
  'How to Choose a Savings or Money App You Can Actually Trust',
  'how-to-choose-a-savings-app-you-can-trust',
  'Before you keep money in any app, run it through these checks — starting with who is allowed to hold your funds.',
  '## Check licensing first

Find out which company operates the app and whether it is licensed to hold or move money by the relevant Nigerian regulator. **If you cannot confirm who is legally responsible for your money, stop there.**

## Read how the returns are produced

Any app promising unusually high, guaranteed returns is telling you something about its risk, not its skill. Real products explain where the money goes.

## Test withdrawal early

Deposit a small amount, then withdraw it. Note how long it takes and whether support responds. Do this before you trust the app with a meaningful balance.

## Look at the small print

- Fees on deposits, withdrawals and early breaks.
- Lock-in periods and penalties.
- Whether your money is held separately from the company''s own funds.

## Watch the day-to-day signals

Consistent app updates, a reachable support channel, clear statements, and honest communication during downtime. **Silence during problems is the clearest warning sign there is.**

## Spread your money

Keep your emergency money where access is fastest, and avoid putting everything in one app, however good it looks today.',
  (SELECT id FROM public.categories WHERE slug = 'apps'),
  'published', false, true, false, 5,
  'How to Choose a Savings App You Can Trust',
  'A checklist for judging Nigerian savings and money apps: licensing, returns, withdrawal tests, fees and warning signs.',
  now() - interval '8 days'
),
(
  'Starting a Small Online Business in Nigeria: The First 30 Days',
  'starting-a-small-online-business-nigeria-first-30-days',
  'A month-long plan to go from idea to first paying customer, without spending on things you do not need yet.',
  '## Week 1: Choose a customer, not just a product

Decide exactly who you are selling to and the problem you solve for them. "Everybody" is not a market. **A narrow, clear offer sells faster than a broad, vague one.**

## Week 2: Set up the basics only

You need a way to be found, a way to be trusted and a way to be paid:

- One social page or simple website with clear photos and prices.
- A short description of what you sell, for whom, and how delivery works.
- A business account or payment link, separate from personal money.

Skip logos, custom packaging and ads for now.

## Week 3: Talk to real people

Message your existing network, join groups where your customers already gather, and ask for referrals directly. Answer questions quickly. Early sales usually come from conversations, not algorithms.

## Week 4: Deliver well, then ask

Deliver carefully, follow up, and ask satisfied customers for a short review or a photo. **Proof from real customers is the cheapest marketing you will ever get.**

## After the first month

Track three numbers: what you spent, what came in, and where each customer heard about you. Put money back into whatever is bringing customers, and cut the rest.',
  (SELECT id FROM public.categories WHERE slug = 'online-business'),
  'published', false, false, false, 6,
  'Starting a Small Online Business in Nigeria: First 30 Days',
  'A four-week plan for launching a small online business in Nigeria, from choosing a customer to getting the first paying sale.',
  now() - interval '10 days'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'beginners'
WHERE a.slug IN (
  'start-a-side-hustle-in-nigeria-with-little-capital',
  'simple-monthly-budget-nigerian-salary',
  'build-an-emergency-fund-nigeria'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'side-hustles'
WHERE a.slug = 'start-a-side-hustle-in-nigeria-with-little-capital'
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'budgeting'
WHERE a.slug = 'simple-monthly-budget-nigerian-salary'
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'savings'
WHERE a.slug IN ('build-an-emergency-fund-nigeria', 'how-to-choose-a-savings-app-you-can-trust')
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'students'
WHERE a.slug = 'money-guide-for-nigerian-students'
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'apps'
WHERE a.slug = 'how-to-choose-a-savings-app-you-can-trust'
ON CONFLICT DO NOTHING;

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a JOIN public.tags t ON t.slug = 'small-business'
WHERE a.slug = 'starting-a-small-online-business-nigeria-first-30-days'
ON CONFLICT DO NOTHING;