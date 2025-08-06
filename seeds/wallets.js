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
			userId: "d91481ed-168f-4c31-826b-7db21f98bab6",
			balance: 1000.0,
			currency: "NGN",
			createdAt: new Date("2025-08-04T16:12:43.000Z"),
			updatedAt: new Date("2025-08-04T16:12:43.000Z"),
		},
		{
			id: "7g8h9i0j-k1l2-m3n4-o5p6-q7r8s9t0u1v3",
			userId: "c9dd3d9a-4957-436f-8a87-795e72dd7669",
			balance: 0.0,
			currency: "NGN",
			createdAt: new Date("2025-08-04T16:30:35.000Z"),
			updatedAt: new Date("2025-08-04T16:30:35.000Z"),
		},
	])
}
