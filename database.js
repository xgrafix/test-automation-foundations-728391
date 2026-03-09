const Database = require('better-sqlite3');

const db = new Database('shop.db', { verbose: console.log });

const items_query = `
    CREATE TABLE IF NOT EXISTS items (
    	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	price REAL NOT NULL,
	image_url TEXT NOT NULL
    )
`;

db.exec(items_query);

const cart_query = `
      CREATE TABLE IF NOT EXISTS cart (
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      PRIMARY KEY (item_id)
    )
`;

db.exec(cart_query);

// Pre-load items into the database
const items = [
    { name: 'Dog', price: 5, image_url: '/images/dog.jpeg' },
    { name: 'Cat', price: 6, image_url: '/images/cat.jpeg' },
    { name: 'Fox', price: 5, image_url: '/images/fox.jpeg' },
    { name: 'Goat', price: 4, image_url: '/images/goat.jpeg' },
    { name: 'Koala', price: 6, image_url: '/images/koala.jpeg' },
    { name: 'Lion', price: 5, image_url: '/images/lion.jpeg' },
    { name: 'Raccoon', price: 6, image_url: '/images/raccoon.jpeg' },
    { name: 'Tiger', price: 7, image_url: '/images/tiger.jpeg' },
    { name: 'Zebra', price: 7, image_url: '/images/zebra.jpeg' },
    { name: 'Bunny', price: 5, image_url: '/images/bunny.jpeg' }
];

const query_items = 'SELECT * FROM items';
const all_items = db.prepare(query_items).all();

// console.log(all_items);

if (all_items == 0) {


    const insert_data = db.prepare("INSERT INTO items (name, price, image_url) VALUES(?, ?, ?)");

    items.forEach((items) => {
        insert_data.run(items.name, items.price, items.image_url);
    });

}

module.exports = db;
