var eaProto2 = artifacts.require("./eaProto2.sol");

//test suite
//load contract and wrap in truffle contract abstraction
contract('eaProto2', function(accounts){

  var eaProto2Instance;
  var admin = accounts[0];
  var client = accounts[1];
  var name = "Test client";
  var description = "Test description";
  var quoteNo = 1;
  var price = 5;
  var paid = false;
  var datePaid = "";

  //vars for testing balances
  var adminBalanceBeforePay, adminBalanceAfterPay;
  var clientBalanceBeforePay, clientBalanceAfterPay;

  //test case1 : initial values
  it("Should be initialised with empty values", function() {
      return eaProto2.deployed().then(function(instance) {
        return instance.getJob();
      }).then(function(data) {
        assert.equal(data[0], 0x0, "admin must be empty");
        assert.equal(data[1], 0x0, "client must be empty");
        assert.equal(data[2], "", "job name shold be empty");
        assert.equal(data[3], "", "job description should be empty");
        assert.equal(data[4].toNumber(), 0, "job quoteNo. should be 0" );
        assert.equal(data[5].toNumber(), 0, "job price must be 0" );
        assert.equal(data[6], false, "paid should be false");
        assert.equal(data[7], "", "datePaid should be empty")
      })
  });

  //test case2 : should add a addJob
  it("should be able to add a new job", function(){
    return eaProto2.deployed().then(function(instance) {
      eaProto2Instance = instance;
      return eaProto2Instance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), {from: admin});
    }).then(function() {
      return eaProto2Instance.getJob();
    }).then(function(data) {
      assert.equal(data[0], admin, "admin must be " + admin);
      assert.equal(data[1], client, "client must be " + client);
      assert.equal(data[2], name, "job name must be " + name);
      assert.equal(data[3], description, "job description must be " + description);
      assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
      assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
      assert.equal(data[6], false, "paid must be set to " + paid);
      assert.equal(data[7], datePaid, "datePaid must be set to " + datePaid);
    });

  });


  //test case3: adding a job should trigger an event
  it("should trigger an event when a job is added", function() {
    return eaProto2.deployed().then(function(instance) {
      eaProto2Instance = instance;
      return eaProto2Instance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), {from: admin});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogAddJob", "event should be LogAddJob");
      assert.equal(receipt.logs[0].args._admin, admin, "admin must be " + admin);
      assert.equal(receipt.logs[0].args._client, client, "client must be " + client);
      assert.equal(receipt.logs[0].args._name, name, "name must be " + name);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(price, "ether"), "job price must be" + price);


    });
  });

  //test case4 : paying a job
  it("should pay for a job", function() {
    return eaProto2.deployed().then(function(instance) {
      eaProto2Instance = instance;
      //set date
      datePaid = "1/1/1";
      //record balances before paying jobs
      adminBalanceBeforePay = web3.fromWei(web3.eth.getBalance(admin), "ether").toNumber();
      clientBalanceBeforePay = web3.fromWei(web3.eth.getBalance(client), "ether").toNumber();
      return eaProto2Instance.payJob(datePaid, {
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

        assert(adminBalanceAfterPay == adminBalanceBeforePay + price, "admin should have been paid " + price + "ETH");
        assert(clientBalanceAfterPay <= clientBalanceBeforePay - price, "client should have paid " + price + "ETH");

        return eaProto2Instance.getJob();
      }).then(function(data) {
        assert.equal(data[0], admin, "admin must be " + admin);
        assert.equal(data[1], client, "client must be " + client);
        assert.equal(data[2], name, "job name must be " + name);
        assert.equal(data[3], description, "job description must be " + description);
        assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
        assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
        assert.equal(data[6], true, "paid must be set to " + true);
        assert.equal(data[7], datePaid, "datePaid must be set to " + datePaid);

      });

    });
  });

/*
//addJob arguments
addJob(address _client, string _name, string _description, uint256 _quoteNo, uint256 _price)


//state variables
address admin;
address client;
string name;
string description;
uint256 quoteNo;
uint256 price;
bool status;

//get job
address _admin,
address _client,
string _name,
string _description,
uint256 _quoteNo,
uint256 _price,
bool _paid



 */
