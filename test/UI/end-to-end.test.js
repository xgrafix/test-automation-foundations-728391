const Chrome = require('selenium-webdriver/chrome');
const { Browser, By, Builder, until } = require("selenium-webdriver");

const chai = require('chai');
const { expect } = chai;

describe('End-to-end test', function () {
  this.timeout(30000); // Set a timeout for Selenium operations
  let driver;

  before(async () => {
    const options = new Chrome.Options();
    options.addArguments('--headless'); // Run in headless mode
    options.addArguments('--disable-gpu'); // Disable GPU acceleration

    driver = new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options.addArguments('--headless=new'))
      .build();

    await driver.get('http://localhost:3000'); // Navigate to the homepage
  });

  after(async () => {
    await driver.quit(); // Close the browser after tests
  });

  it('should add an item to the cart and complete the checkout workflow', async () => {
    const addToCartButton = await driver.findElement(By.id('add-to-cart-10')); // Find the "Add to Cart" button for item 10
    await addToCartButton.click(); // Click the button

    const itemSuccessfullyAddedBanner = await driver.findElement(By.className('notification'));
    const itemSuccessfullyAddedBannerText = await itemSuccessfullyAddedBanner.getText();
    expect(itemSuccessfullyAddedBannerText).to.include('Item successfully added to cart'); // Check the success message

    const cartLink = await driver.findElement(By.id('cart-link')); // Find the cart link
    await cartLink.click(); // Click the link

    const checkoutButton = await driver.findElement(By.id('checkout-button'));
    await checkoutButton.click(); // Click the checkout button
    
    // Wait for the checkout page to load
    await driver.wait(
    until.elementLocated(By.className('checkout-container')),
    5000
  );
    const checkoutPageTitle = await driver.getTitle();
    expect(checkoutPageTitle).to.equal('Checkout'); // Check the page title after checkout

    const checkoutPageText = await driver.findElement(By.className('thank-you-message')).getText();
    expect(checkoutPageText).to.include('Thanks for your order!'); // Check the thank you message
  });
});