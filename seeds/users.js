/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
	// Deletes ALL existing entries
	await knex("users").del()
	await knex("users").insert([
		{
			id: "d91481ed-168f-4c31-826b-7db21f98bab6",
			email: "admin@app.com",
			password: "$argon2id$v=19$m=65536,t=3,p=4$RngtdEItU2JiRmxiS2VUZg$LopGFOS6idiJnGI23/9ZPH1FQdZWJUgrx34VIfX403E",
			firstName: "App",
			lastName: "Admin",
			salt: "Fx-tB-SbbFlbKeTf",
			createdAt: new Date("2025-08-04T16:12:43.000Z"),
			updatedAt: new Date("2025-08-04T16:12:43.000Z"),
		},
		{
			id: "c9dd3d9a-4957-436f-8a87-795e72dd7669",
			email: "jay@gmail.com",
			password: "$argon2id$v=19$m=65536,t=3,p=4$ZXAtelZ1WkN1N2ZsRzhOeg$tY/IAZZ7NCyhN45BJfF2T2H5ooyVkth0PZ1pU55IamI",
			firstName: "Jay",
			lastName: "Doe",
			salt: "ep-zVuZCu7flG8Nz",
			createdAt: new Date("2025-08-04T16:30:35.000Z"),
			updatedAt: new Date("2025-08-04T16:30:35.000Z"),
		},
	])
}
