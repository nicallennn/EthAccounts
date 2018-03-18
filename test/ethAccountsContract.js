var ethAccounts = artifacts.require("./ethAccounts.sol");

//test suite
//load contract and wrap in truffle contract abstraction
contract('ethAccounts', function(accounts){

  var ethAccountsInstance;

  //test job 1 - state variables
  var admin1 = accounts[0];
  var client1 = accounts[1];
  var name1 = "Test name 1";
  var description1 = "Test description 1";
  var quoteNo1 = 1;
  var price1 = 5;
  var paid1 = false;
  var datePaid1 = "";
  var dateMade1 = "";

  //test job 2 - state variables
  var admin2 = accounts[0];
  var client2 = accounts[1];
  var name2 = "Test name 2";
  var description2 = "Test description 2";
  var quoteNo2 = 1;
  var price2 = 10;
  var paid2 = false;
  var datePaid2 = "";
  var dateMade2 = "";


  //vars for testing balances
  var adminBalanceBofer, adminBalanceAfterPay;
  var clientBalanceBeforePay, clientBalanceAfterPay;

  //test case1 : initial values
  it("Should be initialised with empty values", function() {
      return ethAccounts.deployed().then(function(instance) {
        ethAccountsInstance = instance;
        return instance.getJobsLength();
      }).then(function(data) {
        assert.equal(data.toNumber(), 0, "Should be initialised with no jobs");
        return ethAccountsInstance.getUnpaidJobs();
      }).then(function(data){
        assert.equal(data.length, 0, "Get jobs should return empty");
      });
  });

  //test case 2 : should be able to add a new job
  it("should add a job", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      return ethAccountsInstance.addJob(client1, name1, description1, quoteNo1, web3.toWei(price1, "ether"), dateMade1, {from:admin1});
    }).then(function(receipt) {
      //check an event is generated
      assert.equal(receipt.logs.length, 1, "an event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogAddJob", "event should be LogAddJob");
      assert.equal(receipt.logs[0].args._jobId.toNumber(), 1, "event id must be 1");
      assert.equal(receipt.logs[0].args._admin, admin1, "event admin must be " + admin1);
      assert.equal(receipt.logs[0].args._client, client1, "event client must be " + client1);
      assert.equal(receipt.logs[0].args._name, name1, "event name must be " + name1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(price1, "ether"), "event job price must be" + price1);
      assert.equal(receipt.logs[0].args._dateMade, dateMade1, "event date made must be " + dateMade1);

      return ethAccountsInstance.getJobsLength();
    }).then(function(data) {
      assert.equal(data, 1, "number of jobs must be 1");

      return ethAccountsInstance.getUnpaidJobs();
    }).then(function(data) {
      assert.equal(data.length, 1, "there must be 1 job");
      assert.equal(data[0].toNumber(), 1, "job id must be 1");

      return ethAccountsInstance.jobs(data[0]);
      //check job structure variables
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "job id must be 1");
      assert.equal(data[1], admin1, "admin must be " + admin1);
      assert.equal(data[2], client1, "client must be " + client1);
      assert.equal(data[3], name1, "name must be " + name1);
      assert.equal(data[4], description1, "description must be " + description1);
      assert.equal(data[5].toNumber(), quoteNo1, "quote no must be " + quoteNo1 );
      assert.equal(data[6].toNumber(), web3.toWei(price1, "ether"), "price must be " + web3.toWei(price1, "ether"));
      assert.equal(data[7], paid1, "paid made must be " + paid1);
      assert.equal(data[8], dateMade1, "date made must be " + dateMade1);
    });
  });


  //test case3 : should be able to pay for a
  it("should pay for a job", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      //set test date
      datePaid = "1/1/1";
      //record balances before paying jobs
      adminBalanceBeforePay = web3.fromWei(web3.eth.getBalance(admin1), "ether").toNumber();
      clientBalanceBeforePay = web3.fromWei(web3.eth.getBalance(client1), "ether").toNumber();
      //pay for the job (job id, payment date)
      return ethAccountsInstance.payJob(1, datePaid1, {
        from: client1,
        value: web3.toWei(price1, "ether")
        });
        //check logs and run assertions
      }).then(function(receipt) {
        assert.equal(receipt.logs.length, 1, "an event should have been triggered");
        assert.equal(receipt.logs[0].event, "LogPayJob", "event should be LogPayJob");
        assert.equal(receipt.logs[0].args._jobId, 1, "job id must be 1")
        assert.equal(receipt.logs[0].args._client, client1, "client must be " + client1);
        assert.equal(receipt.logs[0].args._admin, admin1, "admin must be " + admin1);
        assert.equal(receipt.logs[0].args._name, name1, "name must be " + name1);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(price1, "ether"), "job price must be" + price1);
        assert.equal(receipt.logs[0].args._date, datePaid1, "datePaid must be " + datePaid1);

        //check balances after job is paid, including gas cost
        adminBalanceAfterPay = web3.fromWei(web3.eth.getBalance(admin1), "ether").toNumber();
        clientBalanceAfterPay = web3.fromWei(web3.eth.getBalance(client1), "ether").toNumber();

        //check payment has been settled
        assert(adminBalanceAfterPay == adminBalanceBeforePay + price1, "admin should have been paid " + price1 + "ETH");
        assert(clientBalanceAfterPay <= clientBalanceBeforePay - price1, "client should have paid " + price1 + "ETH");

    });

    });
  });
