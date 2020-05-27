const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  const airlineInitialFund = web3.utils.toWei("10", "ether");
  const oneEther = web3.utils.toWei("1", "ether");
  const timestamp = Math.floor(Date.now() / 1000);
  const lateFlight = "FLY-1"

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`firstAirline is registered in contract deploy`, async function () {

    // Get operating status
    const airline = await config.flightSuretyApp.getAirline.call(config.firstAirline, { from: config.flightSuretyApp.address });
    
    // Checks airline atributes
    assert.equal(airline[0], 'First Airline', 'Wrong name of first airline');
    assert.equal(airline[1], true, 'First airline is not registered');
    assert.equal(airline[2], 0, "First airline should't have funds");
    assert.equal(airline[3], 0, "First airline should't have votes");
  });

  it(`dataContract has correct initial operational status`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Wrong initial operating status value");

  });

  it(`dataContract can block access to setOperatingStatus() for non-contractOwner account`, async function () {

      // Ensure that access is denied for non-contract Owner account
      let accessDenied = false;
      try {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.firstAirline }); 
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access is not restricted to contractOwner");
            
  });

  it(`dataContract can allow access to setOperatingStatus() for contractOwner`, async function () {

      // Ensure that access is allowed for contractOwner 
      let accessDenied = false;
      try {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access is not restricted to contractOwner");
      
  });

  it(`dataContract can block access to functions by setting operational status to false`, async function () {

    await config.flightSuretyData.setOperatingStatus(false);

    await truffleAssert.reverts(config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address));

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);

  });
 
  it('dataContract can authorize appContract to call dataContract functions', async () => {
    
    // ARRANGE
    let isAuthorized = false;

    // ACT
    try {
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
        isAuthorized = true;
    }
    catch(e) {
        console.log(e);
    }

    // ASSERT
    assert.equal(isAuthorized, true, "dataContract doesn't authorize appContract");

  });

  it('firstAirline can add funds to firstAirline', async () => {

    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.firstAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.firstAirline);

    assert.equal(airline[0], 'First Airline', 'Wrong name of firstAirline');
    assert.equal(airline[1], true, 'firstAirline is not registered');
    assert.equal(airline[2], airlineInitialFund, "firstAirline should have funds");
  });

  it('firstAirline can add secondAirline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.addAirline(config.secondAirline, 'Second Airline', {from: config.firstAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
  
    // Checks airline atributes
    assert.equal(airline[0], 'Second Airline', 'Wrong name of secondAirline');
    assert.equal(airline[1], false, 'secondAirline should not be registered');
    assert.equal(airline[2], 0, "secondAirline should't have funds");
    assert.equal(airline[3], 0, "secondAirline should't have votes");

  });

  it('airline has no fund cannot add an Airline', async () => {
    
    await truffleAssert.reverts(config.flightSuretyApp.addAirline(config.thirdAirline, 'Third Airline', {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);

    // Checks airline atributes
    assert.equal(airline[0], '', 'thirdAirline should not be added by no fund airline');
  });

  it('firstAirline can vote to get second Airline registered', async () => {
    
    await config.flightSuretyApp.vote(config.secondAirline, {from: config.firstAirline});

    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
    assert.equal(airline[0], 'Second Airline', 'Wrong name of second airline');
    assert.equal(airline[1], true, 'secondAirline is not registered');
    assert.equal(airline[2], 0, "secondAirline should't have funds");
  });

  it('secondAirline can fund to secondAirline', async () => {
    
    await config.flightSuretyApp.fund({from: config.secondAirline, value: airlineInitialFund});

    const airline = await config.flightSuretyApp.getAirline.call(config.secondAirline);
    assert.equal(airline[0], 'Second Airline', 'Wrong name of second airline');
    assert.equal(airline[1], true, 'secondAirline is not registered');
    assert.equal(airline[2], airlineInitialFund, "secondAirline should have funds");
  });

  it('secondAirline can add thirdAirline', async () => {
    
    await config.flightSuretyApp.addAirline(config.thirdAirline, 'Third Airline', {from: config.secondAirline});
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    assert.equal(airline[0], 'Third Airline', 'Wrong name of thirdAirline');
    assert.equal(airline[1], false, 'thirdAirline should not be registered');
    assert.equal(airline[2], 0, "thirdAirline should not have funds");
  });

  it('secondAirline can vote to get thirdAirline registered', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.thirdAirline, {from: config.secondAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    // Checks airline atributes
    assert.equal(airline[1], true, 'thirdAirline is not registered');
    assert.equal(airline[2], 0, "thirdAirline should not have fund");
    assert.equal(airline[3], 1, "thirdAirline should have 1 vote");

  });

  it('thirdAirline can fund to thirdAirline', async () => {
    
    await config.flightSuretyApp.fund({from: config.thirdAirline, value: airlineInitialFund});

    const airline = await config.flightSuretyApp.getAirline.call(config.thirdAirline);
    assert.equal(airline[0], 'Third Airline', 'Wrong name of third airline');
    assert.equal(airline[1], true, 'thirdAirline is not registered');
    assert.equal(airline[2], airlineInitialFund, "thirdAirline should have funds");
  });

  it('thirdAirline can add fourthAirline', async () => {
    
    await config.flightSuretyApp.addAirline(config.fourthAirline, 'Fourth Airline', {from: config.thirdAirline});
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);
    assert.equal(airline[0], 'Fourth Airline', 'Wrong name of fourthAirline');
    assert.equal(airline[1], false, 'fourthAirline should not be registered');
    assert.equal(airline[2], 0, "fourthAirline should not have funds");
  });

  it('thirdAirline can vote to get fourthAirline registered', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fourthAirline, {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);
    // Checks airline atributes
    assert.equal(airline[1], true, 'fourthAirline is not registered');
    assert.equal(airline[2], 0, "fourthAirline should not have fund");
    assert.equal(airline[3], 1, "fourthAirline should have 1 vote");

  });

  it('fourthAirline can fund to fourthAirline', async () => {
    
    await config.flightSuretyApp.fund({from: config.fourthAirline, value: airlineInitialFund});

    const airline = await config.flightSuretyApp.getAirline.call(config.fourthAirline);
    assert.equal(airline[0], 'Fourth Airline', 'Wrong name of fourth airline');
    assert.equal(airline[1], true, 'fourthAirline is not registered');
    assert.equal(airline[2], airlineInitialFund, "fourthAirline should have funds");
  });

  it('fourthAirline can add fifthAirline', async () => {
    
    await config.flightSuretyApp.addAirline(config.fifthAirline, 'Fifth Airline', {from: config.fourthAirline});
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);
    assert.equal(airline[0], 'Fifth Airline', 'Wrong name of fifthAirline');
    assert.equal(airline[1], false, 'fifthAirline should not be registered');
    assert.equal(airline[2], 0, "fifthAirline should not have funds");
  });

  it('fourthAirline can not single vote to get fifthAirline registered', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fifthAirline, {from: config.fourthAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);
    // Checks airline atributes
    assert.equal(airline[1], false, 'fifthAirline should not be registered by single vote');
    assert.equal(airline[2], 0, "fifthAirline should not have fund");
    assert.equal(airline[3], 1, "fifthAirline should have 1 vote");

  });

  it('2 votes in the original 4 Airlines can get fifthAirline registered', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.vote(config.fifthAirline, {from: config.thirdAirline}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);
    // Checks airline atributes
    assert.equal(airline[1], true, 'fifthAirline should be registered by 2 votes');
    assert.equal(airline[2], 0, "fifthAirline should not have fund");
    assert.equal(airline[3], 2, "fifthAirline should have 2 vote");

  }); 

  it('fifthAirline can fund to fifthAirline', async () => {
    
    await truffleAssert.passes(config.flightSuretyApp.fund({from: config.fifthAirline, value: airlineInitialFund}));
    const airline = await config.flightSuretyApp.getAirline.call(config.fifthAirline);

    // Checks airline atributes
    assert.equal(airline[0], 'Fifth Airline', 'Wrong name of fifthAirline');
    assert.equal(airline[1], true, 'fifthAirline is not registered');
    assert.equal(airline[2], airlineInitialFund, "fifthAirline should have funds");

  });

  it('fifthAirline can add sixthAirline', async () => {
    
    await config.flightSuretyApp.addAirline(config.sixthAirline, 'Sixth Airline', {from: config.fifthAirline});
    const airline = await config.flightSuretyApp.getAirline.call(config.sixthAirline);
    assert.equal(airline[0], 'Sixth Airline', 'Wrong name of sixthAirline');
    assert.equal(airline[1], false, 'sixthAirline should not be registered');
    assert.equal(airline[2], 0, "fifthAirline should not have funds");
  });

  it("passenger can buy flight insuree", async () => {
    let beforeBalance = await web3.eth.getBalance(config.passengerOne);
    // console.log('beforeBlance is', beforeBalance);

    await truffleAssert.passes(config.flightSuretyApp.buy(config.fifthAirline, lateFlight, timestamp, {from: config.passengerOne, value: oneEther}));

    // Checks passenger balance
    let afterBalance = await web3.eth.getBalance(config.passengerOne);
    // console.log('afterBalance is', afterBalance);
    let diff = beforeBalance - afterBalance;
    // console.log('diff is', diff);
    assert.ok(diff > oneEther, "Balance Wrong!");
  });

  it("passenger can withdraw flight insuree", async () => {
    let beforeBalance = await web3.eth.getBalance(config.passengerOne);
    // console.log('beforeBalance is', beforeBalance);
    await truffleAssert.passes(config.flightSuretyApp.processFlightStatus(config.fifthAirline, lateFlight, timestamp, 20));
    await truffleAssert.passes(config.flightSuretyApp.withdraw({from: config.passengerOne}));

    // Checks passenger balance
    let afterBalance = await web3.eth.getBalance(config.passengerOne);
    // console.log('afterBalance is', afterBalance);
    let diff = afterBalance - beforeBalance;
    // console.log('diff is', diff);
    let compense = oneEther * 1.5;
    assert.ok(diff > compense, "Balance Wrong!");
  });

});
