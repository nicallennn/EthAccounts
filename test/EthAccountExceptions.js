//load the contract
var ethAccounts = artifacts.require("./ethAccounts.sol");

//test suite

contract("ethAccounts", function(accounts) {
  var eaProto2Instance;
  var admin = accounts[0];
  var client = accounts[1];
  var name = "Test client";
  var description = "Test description";
  var quoteNo = 1;
  var price = 5;
  var paid = false;
  var datePaid = "1/1/1";
  var datePaid2 = "2/2/2";
  var dateMade = "1/3/2";

  //test case1 : catch exception for no job yet
  it("should throw an exception if no job is listed yet", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      return ethAccountsInstance.payJob(1, datePaid, {
        from: client,
        value: web3.toWei(price, "ether")
        });
    }).then(assert.fail)
      .catch(function(error) {
        assert(true);
      }).then(function() {
        return ethAccountsInstance.getJobsLength();
      }).then(function(data) {
        assert.equal(data, 0, "job counter must be 0");
      });
  });

  //test case2 : catch exception for paying for already paid job
  it("should throw an exception if the job has already been paid", function() {
    return ethAccounts.deployed().then(function(instance) {
      ethAccountsInstance = instance;
      return ethAccountsInstance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), dateMade, {from: admin});
  }).then(function() {
    return ethAccountsInstance.getUnpaidJobs();
  }).then(function(data) {
    assert.equal(data.length, 1, "there should be one unpaid job");

    return ethAccountsInstance.payJob(1, datePaid, {
      from: client,
      value: web3.toWei(price, "ether")
    }).then(function() {
      return ethAccountsInstance.getUnpaidJobs();



    }).then(function(data) {
      assert.equal(data.length, 0, "there should be 0 unpaid jobs");


    }).then(function() {
        return ethAccountsInstance.payJob(1, datePaid2, {
          from: client,
          value: web3.toWei(price, "ether")
        }).then(assert.fail)
          .catch(function(error) {
            assert(true);
          });
        });
      });

    });

    //test case3 : admin should not be able to pay their own job
    it("should throw an exception if the admin tries to pay for their own job", function() {
      //get an instance of the contract and store it in a state variable
      return ethAccounts.deployed().then(function(instance) {
        ethAccountsInstance = instance;
        //call addJob function to add a job
        return ethAccountsInstance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), dateMade, {from: admin});
      }).then(function() {
        //call PayJob function to pay the job from the admin address
        return ethAccountsInstance.payJob(1, datePaid, {
          from: admin,
          value: web3.toWei(price, "ether")
        }).then(assert.fail)
          //catch the revert - get function call back error
          .catch(function(error) {
           assert(true);
          }).then(function() {
            //call the getJob function
          return ethAccountsInstance.getUnpaidJobs();
        }).then(function(data) {
          //assert.equal(data.length, 1, "there must be 1 job");
          //assert.equal(data[0].toNumber(), 1, "job id must be 1");

          //assert.equal(data[7], paid, "paid made must still be " + paid);

          });
        });
    });

    //test case4 : payment total must match jobs_price
    it("should throw an exception if the client pays the wrong amount", function() {
      ethAccounts.deployed().then(function(instance) {
          ethAccountsInstance = instance;
          return ethAccountsInstance.payJob(1, datePaid, {
            from: client,
            value: web3.toWei(price - 1, "ether")
          }).then(assert.fail)
            .catch(function(error) {
              assert(true);
            }).then(function() {
              return ethAccountsInstance.getUnpaidJobs();
            }).then(function(data) {
              assert.equal(data[0], admin, "admin must be " + admin);
              assert.equal(data[1], client, "client must be " + client);
              assert.equal(data[2], name, "job name must be " + name);
              assert.equal(data[3], description, "job description must be " + description);
              assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
              assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
              assert.equal(data[6], false, "paid must be set to " + paid);
            });
        });

    });

});
