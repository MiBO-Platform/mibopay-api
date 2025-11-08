import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // User
    const user = await prisma.user.upsert({
        where: { email: 'founder@mibo.one' },
        update: {},
        create: {
            email: 'founder@mibo.one',
            name: 'Deiby',
        },
    });

    // Merchant
    const merchant = await prisma.merchant.upsert({
        where: { slug: 'acme-studio' },
        update: {},
        create: {
            name: 'Acme Studio',
            slug: 'acme-studio',
            ownerId: user.id,
            platformFeeBps: 1000,
        },
    });

    // Wallet
    const wallet = await prisma.wallet.upsert({
        where: { address_chain: { address: '0xYourMerchantWallet', chain: 'AVAX_FUJI' } },
        update: {},
        create: {
            label: 'Primary',
            address: '0xYourMerchantWallet',
            chain: 'AVAX_FUJI',
            merchantId: merchant.id,
        },
    });

    await prisma.merchant.update({
        where: { id: merchant.id },
        data: { primaryWalletId: wallet.id },
    });

    // Payment Link demo
    await prisma.paymentLink.upsert({
        where: { code: 'XYZ123' },
        update: {},
        create: {
            merchantId: merchant.id,
            code: 'XYZ123',
            title: 'Logo Design',
            description: 'Payment for design service',
            amount: 50,
            status: 'ACTIVE',
        },
    });

    console.log('✅ Seed complete.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
