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

            //refresh frontend
            return App.refreshFrontend();

          });
     },

/***********                   **************                   ************/

    /************************* JOB FUNCTIONS *************************/

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

       //append the data
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


    /************************* EMPLOYEE FUNCTIONS *************************/

    reloadEmployees: function() {
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
        $('#employeeRow').empty();

       App.contracts.ethAccounts.deployed().then(function(instance) {
         //store contact instance
         ethAccountsInstance = instance;
         //get unpaid jobs
        return ethAccountsInstance.getMyEmployees();
      }).then(function(employeeIds){
        //clear the job fromWei
        $('#employeesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < employeeIds.length; i++){
          var empId = employeeIds[i];
          ethAccountsInstance.employees(empId.toNumber()).then(function(employee) {
            App.displayEmployee(employee[0], employee[3], employee[6], employee[7], employee[4], employee[5]);           /////////////////////////
          });

        }

        App.loading = false;
        var emps = $('#employees');
        $('#employeesRow').append(emps.html());

      }).catch(function(err) {
        console.error(err.message);
        App.loading = false;
      });
    },

    displayEmployee: function(id, name, postal, phone, salary, lastPaid){
      var ethSalary = web3.fromWei(salary, "ether");

      $('#employeeTable').append('<tr><td>'
      + name +
      '</td><td>'
      + postal+
      '</td><td>'
      + phone +
      '</td><td>'
      + ethSalary +
      '</td><td>'
      + lastPaid +
      '</td><td><button type="button" class="btn btn-default btn-pay" data-id="{' + id +'}" data-salary="{' + ethSalary + '}" onclick="App.payEmployee(); return false;">Pay</button></td></tr>');

    },

    addEmployee: function(){
      //get the details of the new employee
      var _emp_address = $('#emp_address').val();
      var _emp_name = $('#emp_name').val();
      var _emp_salary = web3.toWei(parseFloat($('#emp_sal').val() || 0));
      var _emp_post = $('#emp_post').val();
      var _emp_phone = $('#emp_phone').val();

      //check for employee
      if((_emp_name.trim() == '') || (_emp_salary == 0)) {
        //no new employee
        return false;
      }

      //get instance of that contract and call addEmployee function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.addEmployee(_emp_address, _emp_name, _emp_salary, _emp_post, _emp_phone, {
          //metadata for function
          from: App.account,
          gas: 600000,
        });
      }).then(function(result) {

        //catch any errors
      }).catch(function(err) {
        //log errors
        console.error(err);
      });

    },

    payEmployee: function() {
      //block default events
      event.preventDefault();

      //get id
      var _employeeId = $(event.target).data('id');



      //get the job price. event.target is the button clicked
      var _salary = $(event.target).data('salary');

      //remove all non-numeric chars
      _salary = _salary.replace(/[^0-9\.]+/g, "");

      _employeeId = _employeeId.replace(/[^0-9\.]+/g, "");

      //parse to float
      _salary = parseFloat(_salary);

      //parse to int
      _employeeId = parseFloat(_employeeId);

      //get utc date
      _date = $date.toUTCString();

      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.payEmployee(_employeeId, _date, {
          //metadata for function
          from: App.account,
          value: web3.toWei(_salary, "ether"),
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });
    },

    /************************* RESOURCE FUNCTIONS *************************/

    reloadResources: function(){
      //check reentry
      if(App.loading) {
        return;
      }
      App.loading = true;

       //refresh account info
       App.displayAccountInfo();

       //store instance of contract
       var ethAccountsInstance;


       App.contracts.ethAccounts.deployed().then(function(instance) {
         //store contact instance
         ethAccountsInstance = instance;
         //get unpaid jobs
        return ethAccountsInstance.getResources(false);
      }).then(function(resourceIds){
        //clear the job fromWei
        $('#resourcesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < resourceIds.length; i++){
          var rscId = resourceIds[i];
          ethAccountsInstance.resources(rscId.toNumber()).then(function(resource) {
            App.displayUnpaidResource(resource[0], resource[3], resource[2], resource[4], resource[5], resource[6], resource[8]);           /////////////////////////
          });

        }

        return ethAccountsInstance.getResources(true);
      }).then(function(resourceIds) {

        //iterate over jobIds array
        for(var i = 0; i < resourceIds.length; i++){
          var rscId = resourceIds[i];
          ethAccountsInstance.resources(rscId.toNumber()).then(function(resource) {
            App.displayPaidResource(resource[0], resource[3], resource[2], resource[4], resource[5], resource[6], resource[9]);           /////////////////////////
          });

        }

        App.loading = false;
        var resources = $('#resources');
        $('#resourcesRow').append(resources.html());


      }).catch(function(err) {
        console.error(err.message);
        App.loading = false;
      });

    },

    displayUnpaidResource: function(id, name, rsc_address, description, total, po, dueDate ){
      var ethTotal = web3.fromWei(total, "ether");

      $('#unpaidResourcesTable').append('<tr><td>'
      + name +
      '</td><td>'
      + rsc_address+
      '</td><td>'
      + description +
      '</td><td>'
      + ethTotal +
      '</td><td>'
      + po +
      '</td><td>'
      + dueDate +
      '</td><td><button type="button" class="btn btn-default btn-pay" data-id="{' + id +'}" data-total="{' + ethTotal + '}" onclick="App.payResource(); return false;">Pay</button></td></tr>');

    },

    displayPaidResource: function(id, name, rsc_address, description, total, po, datePaid ){
      var ethTotal = web3.fromWei(total, "ether");

      $('#paidResourcesTable').append('<tr><td>'
      + name +
      '</td><td>'
      + rsc_address+
      '</td><td>'
      + description +
      '</td><td>'
      + ethTotal +
      '</td><td>'
      + po +
      '</td><td>'
      + datePaid +
      '</td>');

    },

    addResource: function(){
      //get the details of the new resource
      var _rsc_address = $('#rsc_address').val();
      var _rsc_name = $('#rsc_name').val();
      var _rsc_desc = $('#rsc_description').val();
      var _rsc_total = web3.toWei(parseFloat($('#rsc_total').val() || 0));
      var _rsc_po = $('#rsc_po').val();
      var _rsc_dateDue = $('#rsc_dateDue').val();
      var _rsc_expense = $('#rsc_expense option:selected').text();
      var _datePaid = $date.toUTCString();

      //set expense bool
      if(_rsc_expense == "Yes"){
        _rsc_expense = true;
      }
      else{
        _rsc_expense = false;
      }
      //check for resource
      if((_rsc_name.trim() == '') || (_rsc_total == 0)) {
        //no new employee
        return false;
      }

      //get instance of that contract and call addEmployee function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.addResource(_rsc_address, _rsc_name, _rsc_desc, _rsc_total, _rsc_po, _rsc_dateDue, _rsc_expense, _datePaid, {
          //metadata for function
          from: App.account,
          gas: 600000,
        });
      }).then(function(result) {

        //catch any errors
      }).catch(function(err) {
        //log errors
        console.error(err);
      });
    },

    payResource: function(){
      //block default events
      event.preventDefault();

      //get id
      var _resourceId = $(event.target).data('id');

      //get the job price. event.target is the button clicked
      var _total = $(event.target).data('total');

      //remove all non-numeric chars
      _total = _total.replace(/[^0-9\.]+/g, "");
      _resourceId = _resourceId.replace(/[^0-9\.]+/g, "");

      //parse to float
      _total = parseFloat(_total);

      //parse to int
      _resourceId = parseFloat(_resourceId);

      //get utc date
      _date = $date.toUTCString();

      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.payResource(_resourceId, _date, {
          //metadata for function
          from: App.account,
          value: web3.toWei(_total, "ether"),
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });
    },

    /************************* EXPENSE FUNCTIONS *************************/

    reloadExpenses: function() {
      //check reentry
      if(App.loading) {
        return;
      }
      App.loading = true;

       //refresh account info
       App.displayAccountInfo();

       //store instance of contract
       var ethAccountsInstance;



       App.contracts.ethAccounts.deployed().then(function(instance) {
         //store contact instance
         ethAccountsInstance = instance;
         //get unpaid jobs
        return ethAccountsInstance.getAdminExpenses();
      }).then(function(expenseIds){
        //clear the job fromWei
        $('#expensesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < expenseIds.length; i++){
          var expId = expenseIds[i];
          ethAccountsInstance.adminExpenses(expId.toNumber()).then(function(expense) {
            App.displayAdminExpense(expense[0], expense[2], expense[3], expense[4], expense[5]);
          });

        }

        return ethAccountsInstance.getEmployeeExpenses(false);
      }).then(function(expenseIds) {

        //iterate over jobIds array
        for(var i = 0; i < expenseIds.length; i++){
          var expId = expenseIds[i];
          ethAccountsInstance.employeeExpenses(expId.toNumber()).then(function(expense) {
            App.displayEmployeeExpense(expense[0], expense[3], expense[4], expense[5], expense[6]);           /////////////////////////
          });

        }

        App.loading = false;
        var expenses = $('#expenses');
        $('#expensesRow').append(expenses.html());


      }).catch(function(err) {
        console.error(err.message);
        App.loading = false;
      });
    },

    displayAdminExpense: function(id, name, description, total, dateMade) {
      var ethTotal = web3.fromWei(total, "ether");

      $('#expensesTable').append('<tr><td>'
      + name +
      '</td><td>'
      + description +
      '</td><td>'
      + ethTotal +
      '</td><td>'
      + dateMade +
      '</td>');

    },

    displayEmployeeExpense: function(id, name, description, total, dueDate) {
      var ethTotal = web3.fromWei(total, "ether");

      $('#employeeExpensesTable').append('<tr><td>'
      + name +
      '</td><td>'
      + description +
      '</td><td>'
      + ethTotal +
      '</td><td>'
      + dueDate +
      '</td><td><button type="button" class="btn btn-default btn-pay" data-id="{' + id +'}" data-total="{' + ethTotal + '}" onclick="App.payEmployeeExpense(); return false;">Pay</button></td><td><button type="button" class="btn btn-default btn-pay" data-id="{' + id +'}" onclick="App.denyEmployeeExpense(); return false;">Deny</button></td></tr>');


    },

    addAdminExpense: function() {
      //get the details of the new expense
      var _exp_name = $('#adExp_name').val();
      var _exp_desc = $('#adExp_description').val();
      var _exp_total = web3.toWei(parseFloat($('#adExp_total').val() || 0));
      var _dateMade = $date.toUTCString();

      //check for jobs
      if((_exp_name.trim() == '') || (_exp_total == 0)) {
        //no new jobs
        return false;
      }

      //get instance of that contract and call addJob function
      App.contracts.ethAccounts.deployed().then(function (instance) {
        return instance.addAdminExpense(_exp_name, _exp_desc, _exp_total, _dateMade, {
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

    addEmployeeExpense: function() {
      //get the details of the new expense
      var _exp_employer = $('#adEmExp_employer').val();
      var _exp_name = $('#adEmExp_name').val();
      var _exp_desc = $('#adEmExp_description').val();
      var _exp_total = web3.toWei(parseFloat($('#adEmExp_total').val() || 0));
      var _dateMade = $date.toUTCString();

      //check for jobs
      if((_exp_name.trim() == '') || (_exp_total == 0)) {
        //no new jobs
        return false;
      }

      //get instance of that contract and call addJob function
      App.contracts.ethAccounts.deployed().then(function (instance) {
        return instance.claimEmployeeExpense(_exp_employer, _exp_name, _exp_desc, _exp_total, _dateMade, {
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

    payEmployeeExpense: function() {
      //block default events
      event.preventDefault();

      //get id
      var _expenseId = $(event.target).data('id');

      //get the job price. event.target is the button clicked
      var _total = $(event.target).data('total');

      //remove all non-numeric chars
      _total = _total.replace(/[^0-9\.]+/g, "");
      _expenseId = _expenseId.replace(/[^0-9\.]+/g, "");

      //parse to float
      _total = parseFloat(_total);

      //parse to int
      _expenseId = parseFloat(_expenseId);

      //get utc date
      _date = $date.toUTCString();

      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.payEmployeeExpense(_expenseId, _date, {
          //metadata for function
          from: App.account,
          value: web3.toWei(_total, "ether"),
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });

    },

    denyEmployeeExpense: function() {
      //block default events
      event.preventDefault();

      //get id
      var _expenseId = $(event.target).data('id');

      //remove all non-numeric chars
      _expenseId = _expenseId.replace(/[^0-9\.]+/g, "");

      //parse to int
      _expenseId = parseFloat(_expenseId);


      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.denyEmployeeExpense(_expenseId, {
          //metadata for function
          from: App.account,
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });
    },

    getTotalExpenses: function() {

    },

    /************************* HISTORY FUNCTIONS *************************/

    displayPaidAdminJob: function(id, name, client, description, quoteNo, price, datePaid) {

      var ethPrice = web3.fromWei(price, "ether");

      //append the data
      $('#adminHistoryTable').append('<tr><td>'
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
      + datePaid
      );

    },

    displayPaidClientJobs: function(id, name, admin, description, quoteNo, price, datePaid) {
      var ethPrice = web3.fromWei(price, "ether");

      $('#clientHistoryTable').append('<tr><td>'
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
      + datePaid +
      '</td>');

    },

    /************************* TAX FUNCTIONS *************************/

    displayTaxPayment: function(address, period, date, total) {
      var ethTotal = web3.fromWei(total, "ether");

      $('#taxTable').append('<tr><td>'
      + address.substring(0,8) + "..." +
      '</td><td>'
      + period +
      '</td><td>'
      + date +
      '</td><td>'
      + ethTotal +
      '</td>');
    },

    makeTaxPayment: function() {
      //block default events
      event.preventDefault();

      var _tax_address = $('#tax_address').val();
      var _tax_period = $('#tax_period').val();
      var _tax_total = web3.toWei(parseFloat($('#tax_total').val() || 0));

      //remove all non-numeric chars
      _tax_total = _tax_total.replace(/[^0-9\.]+/g, "");

      //parse to float
      _tax_total = parseFloat(_tax_total);

      //get utc date
      _date = $date.toUTCString();

      //call the payJob function
      App.contracts.ethAccounts.deployed().then(function(instance) {
        return instance.payTax(_tax_address, _tax_period, _date, _tax_total, {
          //metadata for function
          from: App.account,
          value: _tax_total,
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });
    },

    calculateTax: function(totalBeforeExpenses) {
      //get the expenses total

      //subtract from

    },
    /* REFRESH METHOD */
    refreshFrontend: function() {
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


        var jobs = $('#jobs');
        $('#jobsRow').append(jobs.html());

        return ethAccountsInstance.getMyEmployees();
        }).then(function(employeeIds){
        //clear the job fromWei
        $('#employeesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < employeeIds.length; i++){
          var empId = employeeIds[i];
          ethAccountsInstance.employees(empId.toNumber()).then(function(employee) {
            App.displayEmployee(employee[0], employee[3], employee[6], employee[7], employee[4], employee[5]);           /////////////////////////
          });

        }


        var emps = $('#employees');
        $('#employeesRow').append(emps.html());

        return ethAccountsInstance.getResources(false);
      }).then(function(resourceIds){
        //clear the job fromWei
        $('#resourcesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < resourceIds.length; i++){
          var rscId = resourceIds[i];
          ethAccountsInstance.resources(rscId.toNumber()).then(function(resource) {
            App.displayUnpaidResource(resource[0], resource[3], resource[2], resource[4], resource[5], resource[6], resource[8]);           /////////////////////////
          });

        }

        return ethAccountsInstance.getResources(true);
      }).then(function(resourceIds) {

        //iterate over jobIds array
        for(var i = 0; i < resourceIds.length; i++){
          var rscId = resourceIds[i];
          ethAccountsInstance.resources(rscId.toNumber()).then(function(resource) {
            App.displayPaidResource(resource[0], resource[3], resource[2], resource[4], resource[5], resource[6], resource[9]);           /////////////////////////
          });

        }


        var resources = $('#resources');
        $('#resourcesRow').append(resources.html());


        return ethAccountsInstance.getAdminExpenses();
      }).then(function(expenseIds){
        //clear the job fromWei
        $('#expensesRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < expenseIds.length; i++){
          var expId = expenseIds[i];
          ethAccountsInstance.adminExpenses(expId.toNumber()).then(function(expense) {
            App.displayAdminExpense(expense[0], expense[2], expense[3], expense[4], expense[5]);
          });

        }

        return ethAccountsInstance.getEmployeeExpenses(false);
      }).then(function(expenseIds) {

        //iterate over jobIds array
        for(var i = 0; i < expenseIds.length; i++){
          var expId = expenseIds[i];
          ethAccountsInstance.employeeExpenses(expId.toNumber()).then(function(expense) {
            App.displayEmployeeExpense(expense[0], expense[3], expense[4], expense[5], expense[6]);           /////////////////////////
          });

        }

        var expenses = $('#expenses');
        $('#expensesRow').append(expenses.html());

        /* HISTORY */
        return ethAccountsInstance.getPaidJobs(true);
      }).then(function(jobIds){
        //clear the row
        $('#historyRow').empty();

        //iterate over jobIds array
        for(var i = 0; i < jobIds.length; i++){
          var jobId = jobIds[i];
          ethAccountsInstance.jobs(jobId.toNumber()).then(function(job) {
            App.displayPaidAdminJob(job[0], job[3], job[2], job[4], job[5], job[6], job[9]);           /////////////////////////
          });

        }

        //display paid jobs
        return ethAccountsInstance.getPaidJobs(false);
      }).then(function(jobIds) {

        //iterate over jobIds array
        for(var i = 0; i < jobIds.length; i++){
          var jobId = jobIds[i];
          ethAccountsInstance.jobs(jobId.toNumber()).then(function(job) {
            App.displayPaidClientJobs(job[0], job[3], job[1], job[4], job[5], job[6], job[9]);           /////////////////////////
          });
        }


        return ethAccountsInstance.calculateTotals();
      }).then(function(totals) {


        //iterate over jobIds array
        for(var i = 0; i < totals.length; i++){
          totals[i] = web3.fromWei(totals[i], "ether");
        }

        $('#totalsIn').html("Total In: " + totals[0]);
        $('#totalsOut').html("Total Out: " + totals[2]);
        $('#totalsDue').html("Total Due: " + totals[1]);
        $('#totalsOwed').html("Total Owed: " + totals[3]);


        var history = $('#history');
        $('#historyRow').append(history.html());

        /********* TAX **********/

        return ethAccountsInstance.getTaxPayments();
      }).then(function(paymentIds) {

        //iterate over jobIds array
        for(var i = 0; i < paymentIds.length; i++){
          var payId = paymentIds[i];
          ethAccountsInstance.taxMadePayments(payId.toNumber()).then(function(payment) {
            App.displayTaxPayment(payment[2], payment[3], payment[4], payment[5]);           /////////////////////////
          });
        }

        //get total payments in
        return ethAccountsInstance.calculateTotals();
        }).then(function(totals) {

        //iterate over jobIds array
        for(var i = 0; i < totals.length; i++){
          totals[i] = web3.fromWei(totals[i], "ether");
        }

        //set tax calculations
        $('#taxBefore').html("Tax Before Expenses: " + totals[0] * 0.2);
        $('#taxExpenses').html("Expenses: " + totals[4]);
        $('#taxAfter').html("Tax Due: " + ((totals[0] * 0.2) - totals[4]));

        App.loading = false;

        //append to tax row
        var tax = $('#tax');
        $('#taxRow').append(tax.html());



        }).catch(function(err) {
        console.error(err.message);
        App.loading = false;
      });
    },
/***********                   **************                   ************/

    //EVENTS
    eventListener: function() {
        //get instance of deployed contact
        App.contracts.ethAccounts.deployed().then(function(instance) {

          //JOB EVENTS
          instance.LogAddJob({}, {}).watch(function(error, event) {
            App.refreshFrontend();
          });

          instance.LogPayJob({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });

          //EMPLOYEE EVENTS
          instance.LogAddEmployee({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });
          instance.LogPayEmployee({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });

          //RESOURCE EVENTS
          instance.LogAddResource({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });
          instance.LogPayResource({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });

          //EXPENSE EVENTS
          instance.LogAddAdminExpense({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });
          instance.LogEmployeeExpense({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });
          instance.LogPayExpense({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });
          instance.LogDenyEmployeeExpense({}, {}).watch(function(error, event) {

            App.refreshFrontend();
          });

        });
    }
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
