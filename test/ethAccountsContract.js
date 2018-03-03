var ethAccounts = artifacts.require("./ethAccounts.sol");

//test suite
//load contract and wrap in truffle contract abstraction
contract('ethAccounts', function(accounts){

  var ethAccountsInstance;
  var admin = accounts[0];
  var client = accounts[1];
  var name = "Test client";
  var description = "Test description";
  var quoteNo = 1;
  var price = 5;
  var paid = false;
  var datePaid = "";
  var dateMade = "";

  //vars for testing balances
  var adminBalanceBeforePay, adminBalanceAfterPay;
  var clientBalanceBeforePay, clientBalanceAfterPay;

  //test case1 : initial values
  it("Should be initialised with empty values", function() {
      return ethAccounts.deployed().then(function(instance) {
        return instance.getJob();
      }).then(function(data) {
        assert.equal(data[0], 0x0, "admin must be empty");
        assert.equal(data[1], 0x0, "client must be empty");
        assert.equal(data[2], "", "job name shold be empty");
        assert.equal(data[3], "", "job description should be empty");
        assert.equal(data[4].toNumber(), 0, "job quoteNo. should be 0" );
        assert.equal(data[5].toNumber(), 0, "job price must be 0" );
        assert.equal(data[6], false, "paid should be false");
        assert.equal(data[7], "", "dateMade should be empty")
        assert.equal(data[8], "", "datePaid should be empty")
        //add date made
      })
  });

  //test case2 : should add a addJob
  it("should be able to add a new job", function(){
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      dateMade = "1/1/1";
      return ethAccountsInstance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), dateMade, {from: admin});
    }).then(function() {
      return ethAccountsInstance.getJob();
    }).then(function(data) {
      assert.equal(data[0], admin, "admin must be " + admin);
      assert.equal(data[1], client, "client must be " + client);
      assert.equal(data[2], name, "job name must be " + name);
      assert.equal(data[3], description, "job description must be " + description);
      assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
      assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
      assert.equal(data[6], false, "paid must be set to " + paid);
      assert.equal(data[7], dateMade, "datePaid must be set to " + dateMade);
      assert.equal(data[8], datePaid, "datePaid must be set to " + datePaid);
    });

  });


  //test case3: adding a job should trigger an event
  it("should trigger an event when a job is added", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      return ethAccountsInstance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), dateMade,{from: admin});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogAddJob", "event should be LogAddJob");
      assert.equal(receipt.logs[0].args._admin, admin, "admin must be " + admin);
      assert.equal(receipt.logs[0].args._client, client, "client must be " + client);
      assert.equal(receipt.logs[0].args._name, name, "name must be " + name);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
      assert.equal(receipt.logs[0].args._date, dateMade, "date made must be " + dateMade);

    });
  });

  //test case4 : paying a job
  it("should pay for a job", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      //set date
      datePaid = "1/1/1";
      //record balances before paying jobs
      adminBalanceBeforePay = web3.fromWei(web3.eth.getBalance(admin), "ether").toNumber();
      clientBalanceBeforePay = web3.fromWei(web3.eth.getBalance(client), "ether").toNumber();
      return ethAccountsInstance.payJob(datePaid, {
        from: client,
        value: web3.toWei(price, "ether")
        });
        //check logs and run assertions
      }).then(function(receipt) {
        assert.equal(receipt.logs.length, 1, "an event should have been triggered");
        assert.equal(receipt.logs[0].event, "LogPayJob", "event should be LogPayJob");
        assert.equal(receipt.logs[0].args._client, client, "client must be " + client);
        assert.equal(receipt.logs[0].args._admin, admin, "admin must be " + admin);
        assert.equal(receipt.logs[0].args._name, name, "name must be " + name);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
        assert.equal(receipt.logs[0].args._date, datePaid, "datePaid must be " + datePaid);

        //check balances after job is paid, including gas cost
        adminBalanceAfterPay = web3.fromWei(web3.eth.getBalance(admin), "ether").toNumber();
        clientBalanceAfterPay = web3.fromWei(web3.eth.getBalance(client), "ether").toNumber();

        //check payment has been settled
        assert(adminBalanceAfterPay == adminBalanceBeforePay + price, "admin should have been paid " + price + "ETH");
        assert(clientBalanceAfterPay <= clientBalanceBeforePay - price, "client should have paid " + price + "ETH");

        //call getJob method
        return ethAccountsInstance.getJob();
      }).then(function(data) {
        //check values
        assert.equal(data[0], admin, "admin must be " + admin);
        assert.equal(data[1], client, "client must be " + client);
        assert.equal(data[2], name, "job name must be " + name);
        assert.equal(data[3], description, "job description must be " + description);
        assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
        assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
        assert.equal(data[6], true, "paid must be set to " + true);
        assert.equal(data[7], dateMaid, "datePaid must be set to " + datePaid);
        assert.equal(data[8], datePaid, "datePaid must be set to " + datePaid);
        //add date made

      });

    });
  });
