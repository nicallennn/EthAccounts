App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,


     init: function() {
          $date = new Date();
          return App.initWeb3();
     },

/***********                   **************                   ************/

     initWeb3: function() {
          // init web3
          //reuse provider
          if(typeof web3 !== 'undefined'){
            App.web3Provider = web3.currentProvider;
          }
          else {
            //create new provider
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
          }

          //create web3 object
          web3 = new Web3(App.web3Provider);

          //display account info
          App.displayAccountInfo();

          //init contract connection
          return App.initContract();
     },

/***********                   **************                   ************/

     displayAccountInfo: function() {
       web3.eth.getCoinbase(function(err, account) {
         //get user account and check for error
         if(err === null) {
           //account == user account
           App.account = account;
           //append account to dom
           $('#account').text("Account: " + account);
           //get balance of account
           web3.eth.getBalance(account, function(err, balance){
             //get user balance
             if(err === null){
               //append balnace to dom
               $('#accountBalance').text("Balance: E" + web3.fromWei(balance, "ether").toFixed(4) + " | ");
             }
             //convert the balance to gbp
             App.convertToGbp(web3.fromWei(balance, "ether"));

           });
         }
       });


     },

/***********                   **************                   ************/

     convertToGbp: function(balanceInEth) {
       //call api to get current eth value
       var ethValue = "https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=GBP&limit=1";
       $.getJSON(ethValue, function(data){
         //calculate gbp price
         var gbp = (data[0].price_gbp * balanceInEth);
         //append gbp to dom
         $('#accountGbp').text("£" + (gbp).toFixed(2));

       });

     },

/***********                   **************                   ************/

     initContract: function() {
          //jquery ajax call
          $.getJSON('ethAccounts.json', function(ethAccountsArtifact) {
            //get contract and init truffle contract abstraction
            App.contracts.ethAccounts = TruffleContract(ethAccountsArtifact);

            //set provider for contract
            App.contracts.ethAccounts.setProvider(App.web3Provider);

            //add event eventListener
            App.eventListener();

            //retrieve job from contract
            return App.reloadJobs();

          });
     },

/***********                   **************                   ************/

    // CONTRACT FUNCTIONS

    reloadJobs: function() {
      //check reentry
      if(App.loading) {
        return;
      }
      App.loading = true;

       //refresh account info
       App.displayAccountInfo();

       //store instance of contract
       var ethAccountsInstance;

       // //get the job placeholder
       // $('#jobsRow').empty();

       App.contracts.ethAccounts.deployed().then(function(instance) {
         //store contact instance
         ethAccountsInstance = instance;
         //get unpaid jobs
        return ethAccountsInstance.getUnpaidJobs(true);
      }).then(function(jobIds){
        //clear the job fromWei
        $('#jobsRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < jobIds.length; i++){
          var jobId = jobIds[i];
          ethAccountsInstance.jobs(jobId.toNumber()).then(function(job) {
            App.displayUnpaidAdminJob(job[0], job[3], job[2], job[4], job[5], job[6], job[7], job[8] );           /////////////////////////
          });

        }

        return ethAccountsInstance.getUnpaidJobs(false);
      }).then(function(jobIds) {

        //iterate over jobIds array
        for(var i = 0; i < jobIds.length; i++){
          var jobId = jobIds[i];
          ethAccountsInstance.jobs(jobId.toNumber()).then(function(job) {
            App.displayUnpaidClientJobs(job[0], job[3], job[1], job[4], job[5], job[6], job[8]);           /////////////////////////
          });
        }

        App.loading = false;
        var jobs = $('#jobs');
        $('#jobsRow').append(jobs.html());


      }).catch(function(err) {
        console.error(err.message);
        App.loading = false;
      });


     },

     displayUnpaidAdminJob: function(id, name, client, description, quoteNo, price, status, dateCreated) {

       var ethPrice = web3.fromWei(price, "ether");


       $('#jobsAdminTable').append('<tr><td>'
       + name +
       '</td><td>'
       + client.substring(0,8) + "..." +
       '</td><td>'
       + description +
       '</td><td>'
       + quoteNo +
       '</td><td>'
       + ethPrice +
       '</td><td>'
       + dateCreated
       );

     },

     displayUnpaidClientJobs: function(id, name, admin, description, quoteNo, price, dateCreated) {
       var ethPrice = web3.fromWei(price, "ether");

       $('#jobsClientTable').append('<tr><td>'
       + name +
       '</td><td>'
       + admin.substring(0,8) + "..." +
       '</td><td>'
       + description +
       '</td><td>'
       + quoteNo +
       '</td><td>'
       + ethPrice +
       '</td><td>'
       + dateCreated +
       '</td><td><button type="button" class="btn btn-default btn-pay" data-id="{' + id +'}" data-value="{' + ethPrice + '}" onclick="App.payJob(); return false;">Pay</button></td></tr>');

     },

    addJob: function() {
        //get the details of the new job
        var _jobs_client = $('#jobs_client').val();
        var _jobs_name = $('#jobs_name').val();
        var _jobs_quote_no = $('#jobs_quoteNo').val();
        var _jobs_price = web3.toWei(parseFloat($('#jobs_price').val() || 0));
        var _jobs_description = $('#jobs_description').val();
        var _dateMade = $date.toUTCString();

        //check for jobs
        if((_jobs_name.trim() == '') || (_jobs_price == 0)) {
          //no new jobs
          return false;
        }

        //get instance of that contract and call addJob function
        App.contracts.ethAccounts.deployed().then(function (instance) {
          return instance.addJob(_jobs_client, _jobs_name, _jobs_description, _jobs_quote_no, _jobs_price, _dateMade, {
            //metadata for function
            from: App.account,
            gas: 500000,
          });
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });

    },



    payJob: function() {
      //block default events
      event.preventDefault();

      //get id
      var _jobId = $(event.target).data('id');



      //get the job price. event.target is the button clicked
      var _price = $(event.target).data('value');

      //remove all non-numeric chars
      _price = _price.replace(/[^0-9\.]+/g, "");

      _jobId = _jobId.replace(/[^0-9\.]+/g, "");

      //parse to float
      _price = parseFloat(_price);

      //parse to int
      _jobId = parseFloat(_jobId);
      console.log(_jobId);

      //get utc date
      _date = $date.toUTCString();

      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.payJob(_jobId, _date, {
          //metadata for function
          from: App.account,
          value: web3.toWei(_price, "ether"),
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });


    },

/***********                   **************                   ************/

    // EVENTS
    eventListener: function() {
        //get instance of deployed contact
        App.contracts.ethAccounts.deployed().then(function(instance) {
          instance.LogAddJob({}, {}).watch(function(error, event) {
            //check for errors
            if(!error) {
              //add events to list on page
              $("#events").append('<li class="list-group-item"> ' + event.args._name + ' has been added.</li>')
            } else {
              console.error(error);
            }
            App.reloadJobs();
          });
          //add event listener
          instance.LogPayJob({}, {}).watch(function(error, event) {
            //check for errors
            if(!error) {
              //add events to list on page
              $("#events").append('<li class="list-group-item"> ' + event.args._client + ' client paid ' + event.args._admin +
                ' ' + event.args._price + ' for '  + event.args._name + '</li>')
            } else {
              console.error(error);
            }
            App.reloadJobs();
          });

        });
    }

};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
