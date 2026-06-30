const seedAdmin = require("./adminSeeder");
const seedCourses = require("./courseSeeder");

const seedAll = async () => {
    try {
        console.log("Starting seeding process...");
        await seedAdmin();
        await seedCourses();
        console.log("Seeding process completed.");
    } catch (error) {
        console.error("Error during seeding process:", error);
    }
};

module.exports = seedAll;
