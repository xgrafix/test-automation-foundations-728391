const getCartQuantities = require('./middleware/getCartQuantities');
const validateInput = require('./middleware/validateInput');
const calculateTotalPrice = require('./middleware/calculateTotalPrice');

module.exports = (app, db) => {

    // Use the middleware for routes that need cart quantities
    app.use(getCartQuantities());

    app.get('/', (req, res, next) => {
        //res.send('Hello World!')
        //const query = 'SELECT * FROM items';
        const cartQuery = `
    SELECT items.id as id, items.name, items.price, cart.quantity
    FROM cart
    JOIN items ON cart.item_id = items.id
    `;

        const cartItems = db.prepare(cartQuery).all();
        //let cartItems;

        if (!cartItems) {
            return res.status(500).send('Error fetching cart items');
        }

        req.items = cartItems;
        next();

    }, getCartQuantities(), (req, res) => {
        const cartItemsQuery = 'SELECT * FROM items';
        const items = db.prepare(cartItemsQuery).all();

        if (!items) {
            return res.status(500).send('Internal Server Error');
        }

        const cartCount = req.items.reduce((sum, item) => sum + item.quantity, 0); // Calculate cartCount
        //   console.log("cart Count" + cartCount);
        res.render('index', {
            items,
            cartQuantities: req.cartQuantities, // Use cart quantities from middleware
            showRemoveForm: false,
            cartCount,
            message: req.query.message // Get the message from the query string
        });
    }
    );

    //Remove item route
    app.get('/remove', (req, res) => {
        const itemsQuery = 'SELECT * FROM items';
        const items = db.prepare(itemsQuery).all();

        if (!items) {
            return res.status(500).send('Error fetching items');
        }

        const cartSumQuery = 'SELECT SUM(quantity) AS count FROM cart WHERE quantity > 0';
        const row = db.prepare(cartSumQuery).all();

        // console.log('row count ' + row[0]['count']);

        const cartCount = row[0]['count'] || 0;
        res.render('index', {
            items,
            cartQuantities: req.cartQuantities,
            showRemoveForm: true,
            cartCount
        });

        // res.json(row);

    });


    // Add item to cart route
    app.post('/add-to-cart', validateInput, (req, res) => {
        const { itemId } = req.body;

        const row = db.prepare('SELECT quantity FROM cart where item_id = ?')
            .pluck()
            .get(itemId);

        try {

            if (row) {
                if (row < 10) {
                    const update_row = db.prepare('UPDATE cart SET quantity = quantity + 1 WHERE item_id = ?');

                    update_row.run(parseInt(itemId));

                    res.redirect('/?message=Item+successfully+added+to+cart');
                }
                else {
                    res.redirect('/?message=Item+already+at+max+quantity');
                }
            } else {
                const insert_row = db.prepare('INSERT INTO cart (item_id, quantity) VALUES (?, 1)');

                insert_row.run(itemId);

                res.redirect('/?message=Item+successfully+added+to+cart');
            }
        }
        catch (error) {
            return res.status(500).send('Error querying cart');
        }

    });

    app.post('/remove-item', (req, res) => {
        const { itemId } = req.body; // Assuming the item ID is sent in the request body

        // Remove the item from the items table
        const delete_item_id = db.prepare('DELETE FROM items WHERE id = ?');
        delete_item_id.run(itemId);

        if (!delete_item_id) {
            //return res.status(500).send('Error removing item');

            // Remove the corresponding entry from the cart table
            const remove_from_cart = db.prepare('DELETE FROM cart WHERE item_id = ?');
            remove_from_cart.run(itemId);

            if (!remove_from_cart) {
                return res.status(500).send('Error removing item from cart');
            }

            res.redirect('/'); // Redirect back to the home page after deletion
        }
    });


    // Update item quantity in cart route
    app.post('/update-quantity', (req, res) => {
        const { itemId, quantity } = req.body;

        // Parse the quantity as an integer and ensure it's within the allowed range (0 to 10)
        const validQuantity = Math.max(0, Math.min(10, parseInt(quantity, 10)));

        if (isNaN(validQuantity)) {
            return res.status(400).send('Invalid quantity');
        }

        if (validQuantity === 0) {
            // Remove the item from the cart if quantity is 0
            const delete_item_from_cart = db.prepare('DELETE FROM cart WHERE item_id = ?');
            delete_item_from_cart.run((itemId));

            if (!delete_item_from_cart) {
                return res.status(500).send('Error updating quantity');
            }
            res.redirect('/cart');
        }
        else {
            // Update the quantity in the cart
            const update_item_quantity = db.prepare('UPDATE cart SET quantity = ? WHERE item_id = ?');
            update_item_quantity.run(validQuantity, itemId);
            if (!update_item_quantity) {
                return res.status(500).send('Error updating quantity');
            }
            res.redirect('/cart');
        }
    });

    app.get('/cart', (req, res, next) => {
        const query = `
        SELECT items.id AS id, items.name, items.price, cart.quantity
        FROM cart
        JOIN items ON cart.item_id = items.id`
            ;

        const cartItems = db.prepare(query).all();
        req.items = cartItems;
        next();

    }, getCartQuantities(), calculateTotalPrice(), (req, res) => {
        // Render the cart page
        const cartCount = req.items.reduce((sum, item) => sum + item.quantity, 0); // Calculate cartCount
        res.render('cart', {
            cartItems: req.items,
            totalPrice: req.totalPrice,
            cartCount
        });
    });

    app.post('/reset-cart', (req, res) => {
        const reset_cart = db.prepare('DELETE FROM cart');
        reset_cart.run();

        if (!reset_cart) {
            return res.status(500).send('Error removing all items');
        }

        res.redirect('/');
    });


    // Checkout route
    app.get('/checkout', (req, res, next) => {
        // Fetch items in the cart
        const query = `
        SELECT items.id AS id, items.name, items.price, cart.quantity
        FROM cart
        JOIN items ON cart.item_id = items.id
  `;
        const cartItems = db.prepare(query).all();
        if (!cartItems) {
            return res.status(500).send('Error fetching cart items');
        }

        req.items = cartItems; // Attach cart items to req
        next(); // Pass control to the getCartQuantities middleware
    }, getCartQuantities(), calculateTotalPrice(), (req, res) => {
        res.render('checkout', { totalPrice: req.totalPrice });
    });

}

