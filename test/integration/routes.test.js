const request = require('supertest');
const chai = require('chai');
const { expect } = chai;
const Database = require('better-sqlite3');
const db = new Database(':memory:'); // Use in-memory database
const app = require('../../app')(db); // Pass the in-memory database

// Helper function to execute SQL queries with async/await
function runQuery(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.prepare(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

describe('Integration tests for routes', () => {
    before(async () => {
        // Create tables in the in-memory database
        const items_table = `CREATE TABLE items (
                id INTEGER PRIMARY KEY,
                name TEXT,
                price REAL
            )
        `;

        db.exec(items_table);

        const cart_table = `
            CREATE TABLE cart (
                item_id INTEGER,
                quantity INTEGER
            )
        `;

        db.exec(cart_table);

        // Seed initial data
        const insert_items = db.prepare("INSERT INTO items (id, name, price) VALUES(?, ?, ?)");
        await insert_items.run(1, "Test Item", 10.0);
        //runQuery(db, 'INSERT INTO items (id, name, price) VALUES (1, "Test Item", 10.0)');
    });

    after(async () => {
        // Drop tables to clean up
        await db.exec('DROP TABLE IF EXISTS items');
        await db.exec('DROP TABLE IF EXISTS cart');
    });

    it('should add an item to the cart', async () => {
        const res = await request(app)
            .post('/add-to-cart')
            .send({ itemId: 1 });
        expect(res.status).to.equal(302); // Expect a redirect
        expect(res.headers.location).to.include('/?message=Item+successfully+added+to+cart');

        // Verify the item was added to the cart
        const cart = db.prepare('SELECT * FROM cart WHERE item_id = 1').all();
        expect(cart).to.not.be.null;
        expect(cart[0]['quantity']).to.equal(1);
    });

    it('should display the cart page', async () => {
        //await runQuery(db, 'INSERT INTO cart (item_id, quantity) VALUES (1, 2)');

        const insert_items = db.prepare('INSERT INTO cart (item_id, quantity) VALUES (?, ?)');
        await insert_items.run(1, 2);

        const res = await request(app).get('/cart');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Test Item');
    });

    it('should display the checkout page', async () => {
        //await runQuery(db, 'INSERT INTO cart (item_id, quantity) VALUES (1, 2)');
        const insert_items = db.prepare('INSERT INTO cart (item_id, quantity) VALUES (?, ?)');
        await insert_items.run(1, 2);

        const res = await request(app).get('/checkout');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Thanks for your order!');
    });
});
