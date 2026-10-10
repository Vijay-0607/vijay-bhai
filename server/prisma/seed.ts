import { PrismaClient, UserRole, Language, CropType, ListingStatus, DemandStatus, OfferStatus, DealStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultPasswordHash = await argon2.hash('Password123!');
  const adminPasswordHash = await argon2.hash(process.env.ADMIN_SEED_PASSWORD || 'ChangeMe_Admin_2025!');

  // 1. Create Admin User
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@mandimatch.internal';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'System Admin',
      email: adminEmail,
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      district: 'Hubballi',
      preferredLanguage: Language.EN,
      profileDescription: 'System administrator for MandiMatch platform',
      rating: 5.0,
      completedDealsCount: 0,
    },
  });
  console.log('✅ Admin user created/verified');

  // 2. Demo Users
  const usersData = [
    {
      id: 'user-farmer-lakshmi',
      name: 'Lakshmi Devi',
      email: 'farmer@mandimatch.demo',
      phone: '9845012345',
      role: UserRole.FARMER,
      district: 'Dharwad',
      preferredLanguage: Language.EN,
      profileDescription: 'Progressive horticultural farmer growing Grade-A hybrid tomatoes and pulses in Dharwad district.',
      rating: 4.9,
      completedDealsCount: 14,
    },
    {
      id: 'user-buyer-hotel-naveen',
      name: 'Hotel Naveen Procurement',
      email: 'buyer@mandimatch.demo',
      phone: '9448067890',
      role: UserRole.BUYER,
      district: 'Hubballi',
      preferredLanguage: Language.EN,
      profileDescription: 'Hospitality & culinary chain sourcing fresh daily vegetables directly from local farm gates.',
      rating: 4.8,
      completedDealsCount: 32,
    },
    {
      id: 'user-fpo-basavaraj',
      name: 'Basavaraj Raitha Utpadaka FPO',
      email: 'fpo@mandimatch.demo',
      phone: '9342054321',
      role: UserRole.FPO,
      district: 'Hubballi',
      preferredLanguage: Language.KN,
      profileDescription: 'Registered Farmers Producer Organization aggregating quality farm produce across 48 local smallholders.',
      rating: 4.9,
      completedDealsCount: 56,
    },
    {
      id: 'user-farmer-mahesh',
      name: 'Mahesh Patil',
      email: 'mahesh@mandimatch.demo',
      phone: '9741099887',
      role: UserRole.FARMER,
      district: 'Gadag',
      preferredLanguage: Language.KN,
      profileDescription: 'Grain & cereal grower focusing on high starch corn and millets in Gadag black soil belt.',
      rating: 4.7,
      completedDealsCount: 8,
    },
    {
      id: 'user-farmer-savita',
      name: 'Savita Hiremath',
      email: 'savita@mandimatch.demo',
      phone: '9886033445',
      role: UserRole.FARMER,
      district: 'Belagavi',
      preferredLanguage: Language.EN,
      profileDescription: 'Specialist in red bell onions and root vegetables with post-harvest sorting shade net facility.',
      rating: 4.8,
      completedDealsCount: 19,
    },
    {
      id: 'user-buyer-freshkart',
      name: 'FreshKart Retail Network',
      email: 'freshkart@mandimatch.demo',
      phone: '9844011223',
      role: UserRole.BUYER,
      district: 'Dharwad',
      preferredLanguage: Language.EN,
      profileDescription: 'Omnichannel grocery retailer with cold chain fulfillment centers in Dharwad & Belagavi.',
      rating: 4.7,
      completedDealsCount: 65,
    },
    {
      id: 'user-buyer-annapurna',
      name: 'Annapurna Agro Foods',
      email: 'annapurna@mandimatch.demo',
      phone: '9900044556',
      role: UserRole.BUYER,
      district: 'Hubballi',
      preferredLanguage: Language.HI,
      profileDescription: 'Bulk food processing plant manufacturing starch and animal feed grits in Hubballi industrial estate.',
      rating: 4.9,
      completedDealsCount: 41,
    },
    {
      id: 'user-buyer-sri-veg',
      name: 'Sri Veg Mart Wholesalers',
      email: 'sriveg@mandimatch.demo',
      phone: '9480077889',
      role: UserRole.BUYER,
      district: 'Belagavi',
      preferredLanguage: Language.KN,
      profileDescription: 'Regional wholesale distributor supplying commercial kitchens and retail mandis in Belagavi region.',
      rating: 4.6,
      completedDealsCount: 28,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: defaultPasswordHash,
        role: u.role,
        district: u.district,
        preferredLanguage: u.preferredLanguage,
        profileDescription: u.profileDescription,
        rating: u.rating,
        completedDealsCount: u.completedDealsCount,
      },
    });
  }
  console.log(`✅ Seeded ${usersData.length} demo users`);

  // 3. FPO Organization
  const fpoUser = await prisma.user.findUnique({ where: { phone: '9342054321' } });
  if (fpoUser) {
    await prisma.fpo.upsert({
      where: { ownerUserId: fpoUser.id },
      update: {},
      create: {
        ownerUserId: fpoUser.id,
        organizationName: 'Basavaraj Raitha Utpadaka FPO',
        district: 'Hubballi',
        description: 'Aggregating quality produce across 48 local member farms in Dharwad-Hubballi cluster.',
        members: {
          create: {
            userId: fpoUser.id,
            role: 'OWNER',
          },
        },
      },
    });
    console.log('✅ Seeded FPO Organization');
  }

  // 4. Listings
  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 86400000);

  const listingsData = [
    {
      id: 'listing-tomato-fpo',
      farmerId: 'user-fpo-basavaraj',
      crop: CropType.Tomato,
      quantityQtl: 40,
      remainingQuantityQtl: 40,
      harvestDate: addDays(10),
      askingPricePerQtl: 1900,
      district: 'Hubballi',
      description: 'Grade A hybrid semi-ripe tomatoes, pooled from 8 FPO members. Uniform sizing.',
      status: ListingStatus.ACTIVE,
    },
    {
      id: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      crop: CropType.Tomato,
      quantityQtl: 25,
      remainingQuantityQtl: 25,
      harvestDate: addDays(7),
      askingPricePerQtl: 2300,
      district: 'Dharwad',
      description: 'Drip irrigated table tomatoes with 10 days shelf life. Crated at harvest.',
      status: ListingStatus.ACTIVE,
    },
    {
      id: 'listing-mahesh-maize',
      farmerId: 'user-farmer-mahesh',
      crop: CropType.Maize,
      quantityQtl: 60,
      remainingQuantityQtl: 60,
      harvestDate: addDays(14),
      askingPricePerQtl: 2200,
      district: 'Gadag',
      description: 'Yellow corn with moisture content below 12%. Machine shelled.',
      status: ListingStatus.ACTIVE,
    },
    {
      id: 'listing-savita-onion',
      farmerId: 'user-farmer-savita',
      crop: CropType.Onion,
      quantityQtl: 35,
      remainingQuantityQtl: 5, // 30 reserved/sold
      harvestDate: addDays(12),
      askingPricePerQtl: 1650,
      district: 'Belagavi',
      description: 'Medium to large Bellary red onions, naturally sun-cured and bagged in mesh sacks.',
      status: ListingStatus.PARTIALLY_RESERVED,
    },
    {
      id: 'listing-chilli-demo',
      farmerId: 'user-fpo-basavaraj',
      crop: CropType.Green_chilli,
      quantityQtl: 18,
      remainingQuantityQtl: 18,
      harvestDate: addDays(6),
      askingPricePerQtl: 4100,
      district: 'Hubballi',
      description: 'High pungency G-4 green chillies. Plucked fresh early morning.',
      status: ListingStatus.ACTIVE,
    },
  ];

  for (const l of listingsData) {
    await prisma.listing.upsert({
      where: { id: l.id },
      update: {},
      create: l,
    });
  }
  console.log(`✅ Seeded ${listingsData.length} listings`);

  // 5. Demands
  const demandsData = [
    {
      id: 'demand-naveen-tomato',
      buyerId: 'user-buyer-hotel-naveen',
      crop: CropType.Tomato,
      quantityQtl: 30,
      remainingQuantityQtl: 30,
      deliveryDate: addDays(8),
      maxPricePerQtl: 2000,
      district: 'Hubballi',
      description: 'Firm ripe tomatoes for commercial kitchen food preparation. Doorstep delivery preferred.',
      status: DemandStatus.ACTIVE,
    },
    {
      id: 'demand-freshkart-tomato',
      buyerId: 'user-buyer-freshkart',
      crop: CropType.Tomato,
      quantityQtl: 50,
      remainingQuantityQtl: 50,
      deliveryDate: addDays(11),
      maxPricePerQtl: 2100,
      district: 'Dharwad',
      description: 'Quality inspection required at Hubballi-Dharwad sorting center. Prompt payment on delivery.',
      status: DemandStatus.ACTIVE,
    },
    {
      id: 'demand-annapurna-maize',
      buyerId: 'user-buyer-annapurna',
      crop: CropType.Maize,
      quantityQtl: 80,
      remainingQuantityQtl: 80,
      deliveryDate: addDays(15),
      maxPricePerQtl: 2400,
      district: 'Hubballi',
      description: 'Looking for single or multi-farmer aggregated bulk lots. Moisture test at intake bay.',
      status: DemandStatus.ACTIVE,
    },
    {
      id: 'demand-sriveg-onion',
      buyerId: 'user-buyer-sri-veg',
      crop: CropType.Onion,
      quantityQtl: 30,
      remainingQuantityQtl: 0, // fulfilled
      deliveryDate: addDays(13),
      maxPricePerQtl: 1800,
      district: 'Belagavi',
      description: 'Clean dried bulbs required for wholesale distribution network in Belagavi APMC.',
      status: DemandStatus.FULFILLED,
    },
    {
      id: 'demand-chilli-spices',
      buyerId: 'user-buyer-hotel-naveen',
      crop: CropType.Green_chilli,
      quantityQtl: 15,
      remainingQuantityQtl: 15,
      deliveryDate: addDays(7),
      maxPricePerQtl: 4300,
      district: 'Hubballi',
      description: 'Direct farm gate procurement with sorted grading.',
      status: DemandStatus.ACTIVE,
    },
  ];

  for (const d of demandsData) {
    await prisma.demand.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }
  console.log(`✅ Seeded ${demandsData.length} demands`);

  // 6. Pre-computed Matches
  const matchesData = [
    {
      id: 'match-fpo-naveen',
      listingId: 'listing-tomato-fpo',
      demandId: 'demand-naveen-tomato',
      score: 95,
      qtyFit: 0.90,
      priceFit: 0.98,
      dateFit: 0.96,
      distFit: 1.0,
      tradeQuantityQtl: 30,
      suggestedPricePerQtl: 1950,
      dealValue: 58500,
      commissionEstimate: 1462.5,
    },
    {
      id: 'match-lakshmi-freshkart',
      listingId: 'listing-tomato-lakshmi',
      demandId: 'demand-freshkart-tomato',
      score: 92,
      qtyFit: 0.85,
      priceFit: 0.92,
      dateFit: 0.94,
      distFit: 1.0,
      tradeQuantityQtl: 25,
      suggestedPricePerQtl: 2200,
      dealValue: 55000,
      commissionEstimate: 1375,
    },
    {
      id: 'match-mahesh-annapurna',
      listingId: 'listing-mahesh-maize',
      demandId: 'demand-annapurna-maize',
      score: 89,
      qtyFit: 0.88,
      priceFit: 0.95,
      dateFit: 0.92,
      distFit: 0.80,
      tradeQuantityQtl: 60,
      suggestedPricePerQtl: 2300,
      dealValue: 138000,
      commissionEstimate: 3450,
    },
    {
      id: 'match-savita-sriveg',
      listingId: 'listing-savita-onion',
      demandId: 'demand-sriveg-onion',
      score: 96,
      qtyFit: 0.95,
      priceFit: 0.97,
      dateFit: 0.95,
      distFit: 1.0,
      tradeQuantityQtl: 30,
      suggestedPricePerQtl: 1720,
      dealValue: 51600,
      commissionEstimate: 1290,
    },
  ];

  for (const m of matchesData) {
    await prisma.match.upsert({
      where: { listingId_demandId: { listingId: m.listingId, demandId: m.demandId } },
      update: {},
      create: m,
    });
  }
  console.log(`✅ Seeded ${matchesData.length} matches`);

  // 7. Offers & Deals
  // Offer 1: Pending offer from Naveen to Basavaraj FPO
  const offer1 = await prisma.offer.upsert({
    where: { id: 'offer-seed-1' },
    update: {},
    create: {
      id: 'offer-seed-1',
      listingId: 'listing-tomato-fpo',
      demandId: 'demand-naveen-tomato',
      farmerId: 'user-fpo-basavaraj',
      buyerId: 'user-buyer-hotel-naveen',
      quantityQtl: 30,
      pricePerQtl: 1950,
      totalValue: 58500,
      commission: 1462.5,
      message: 'Initial pre-harvest offer based on estimated delivery next week.',
      status: OfferStatus.PENDING,
      currentTurnId: 'user-fpo-basavaraj',
      history: {
        create: {
          id: 'hist-1',
          senderId: 'user-buyer-hotel-naveen',
          pricePerQtl: 1950,
          quantityQtl: 30,
          note: 'Initial pre-harvest offer based on estimated delivery next week.',
          statusSnapshot: 'PENDING',
        },
      },
    },
  });

  // Offer 2: Accepted offer between Savita and Sri Veg Mart, with completed Deal
  const offer2 = await prisma.offer.upsert({
    where: { id: 'offer-seed-2' },
    update: {},
    create: {
      id: 'offer-seed-2',
      listingId: 'listing-savita-onion',
      demandId: 'demand-sriveg-onion',
      farmerId: 'user-farmer-savita',
      buyerId: 'user-buyer-sri-veg',
      quantityQtl: 30,
      pricePerQtl: 1720,
      totalValue: 51600,
      commission: 1290,
      message: 'Counteroffer accepted by buyer.',
      status: OfferStatus.ACCEPTED,
      currentTurnId: 'none',
      history: {
        create: [
          {
            id: 'hist-2a',
            senderId: 'user-buyer-sri-veg',
            pricePerQtl: 1700,
            quantityQtl: 30,
            note: 'Offer sent for high grade onions.',
            statusSnapshot: 'PENDING',
          },
          {
            id: 'hist-2b',
            senderId: 'user-farmer-savita',
            pricePerQtl: 1720,
            quantityQtl: 30,
            note: 'Counteroffer for premium graded produce.',
            statusSnapshot: 'NEGOTIATING',
          },
          {
            id: 'hist-2c',
            senderId: 'user-buyer-sri-veg',
            pricePerQtl: 1720,
            quantityQtl: 30,
            note: 'Counteroffer accepted by buyer.',
            statusSnapshot: 'ACCEPTED',
          },
        ],
      },
    },
  });

  // Create confirmed Deal for Offer 2
  await prisma.deal.upsert({
    where: { offerId: offer2.id },
    update: {},
    create: {
      id: 'deal-seed-onion',
      listingId: 'listing-savita-onion',
      demandId: 'demand-sriveg-onion',
      matchId: 'match-savita-sriveg',
      offerId: offer2.id,
      farmerId: 'user-farmer-savita',
      buyerId: 'user-buyer-sri-veg',
      quantityQtl: 30,
      agreedPricePerQtl: 1720,
      totalValue: 51600,
      commissionRate: 0.025,
      commissionAmount: 1290,
      status: DealStatus.CONFIRMED,
      confirmedAt: new Date(now.getTime() - 12 * 3600000),
    },
  });
  console.log('✅ Seeded demo offers and deals');

  // 8. Notifications
  const notificationsData = [
    {
      id: 'notif-1',
      userId: 'user-farmer-lakshmi',
      title: 'High-Fit Buyer Match Available!',
      message: 'FreshKart Retail Network matches your Dharwad tomato listing with a 92% fit score.',
      type: 'new_match',
      isRead: false,
      link: '/matches',
    },
    {
      id: 'notif-2',
      userId: 'user-farmer-lakshmi',
      title: 'Simulated Price Alert Triggered',
      message: 'Hubballi tomato benchmark reached ₹2,150/q, exceeding your watch price of ₹2,100.',
      type: 'price_alert',
      isRead: false,
      link: '/prices',
    },
    {
      id: 'notif-3',
      userId: 'user-fpo-basavaraj',
      title: 'New Offer Received',
      message: 'Hotel Naveen offered ₹1,950/quintal for 30 quintals of upcoming tomatoes.',
      type: 'new_offer',
      isRead: false,
      link: '/offers',
    },
    {
      id: 'notif-4',
      userId: 'user-buyer-hotel-naveen',
      title: 'Demo Deal Confirmed',
      message: 'Your pre-harvest agreement with Basavaraj FPO has been verified for demonstration.',
      type: 'deal_confirmed',
      isRead: true,
      link: '/deals',
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: n,
    });
  }
  console.log(`✅ Seeded ${notificationsData.length} notifications`);

  // 9. Baseline Price Records
  const priceRecords = [
    { crop: CropType.Tomato, market: 'Hubballi APMC', district: 'Hubballi', pricePerQtl: 2000, minPrice: 1350, maxPrice: 2950, volumeQtl: 1200 },
    { crop: CropType.Tomato, market: 'Dharwad APMC', district: 'Dharwad', pricePerQtl: 2150, minPrice: 1400, maxPrice: 3000, volumeQtl: 850 },
    { crop: CropType.Maize, market: 'Hubballi APMC', district: 'Hubballi', pricePerQtl: 2280, minPrice: 1850, maxPrice: 2500, volumeQtl: 2100 },
    { crop: CropType.Maize, market: 'Gadag APMC', district: 'Gadag', pricePerQtl: 2260, minPrice: 1800, maxPrice: 2450, volumeQtl: 1750 },
    { crop: CropType.Onion, market: 'Belagavi APMC', district: 'Belagavi', pricePerQtl: 3100, minPrice: 1800, maxPrice: 4800, volumeQtl: 1500 },
    { crop: CropType.Green_chilli, market: 'Hubballi APMC', district: 'Hubballi', pricePerQtl: 4450, minPrice: 2800, maxPrice: 6200, volumeQtl: 500 },
  ];

  for (const pr of priceRecords) {
    await prisma.priceRecord.create({
      data: {
        crop: pr.crop,
        market: pr.market,
        district: pr.district,
        pricePerQtl: pr.pricePerQtl,
        minPrice: pr.minPrice,
        maxPrice: pr.maxPrice,
        volumeQtl: pr.volumeQtl,
        recordedAt: now,
      },
    });
  }
  console.log(`✅ Seeded ${priceRecords.length} price records`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
