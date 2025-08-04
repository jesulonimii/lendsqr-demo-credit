/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
	// Deletes ALL existing entries
	await knex("wallets").del()
	await knex("wallets").insert([
		{
			id: "1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
			userId: "029d3b1a-a456-4df5-ad29-a2c89113b28a",
			balance: 1000.00,
			currency: "NGN",
			createdAt: new Date("2025-08-04T16:12:43.000Z"),
			updatedAt: new Date("2025-08-04T16:12:43.000Z"),
		},
		{
			id: "7g8h9i0j-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
			userId: "c9dc3d9a-4957-436f-8a87-795e72dd7669",
			balance: 500.00,
			currency: "NGN",
			createdAt: new Date("2025-08-04T16:30:35.000Z"),
			updatedAt: new Date("2025-08-04T16:30:35.000Z"),
		},
	])
}
