import { openRepo } from "./_repo";
const repo = openRepo();
console.log(`Database ready. ${repo.listCategories().length} categories, ${repo.counts().total} Skills.`);
