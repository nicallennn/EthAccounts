**** PROJECT DEMO CODE ****
***************************

* DEPLOY *

//migrate and deploy contracts
migrate --compile-all --reset

//get instance of contract
ethAccounts.deployed().then(function(instance) {app = instance;})

*********************************************************************************

* EVENTS *

//job events
var addJobEvent = app.LogAddJob({},{}).watch(function(error, event){console.log(event);})
var payJobEvent = app.LogPayJob({},{}).watch(function(error, event){console.log(event);})

//employee events
var addEmpEvent = app.LogAddEmployee({},{}).watch(function(error, event){console.log(event);})
var payEmpEvent = app.LogPayEmployee({},{}).watch(function(error, event){console.log(event);})

var editEmpSalaryEvent = app.LogEditSalary({},{}).watch(function(error, event){console.log(event);})
var updateContactEvent = app.LogUpdateContactDetails({},{}).watch(function(error, event){console.log(event);})

//resource events
var addResourceEvent = app.LogAddResource({},{}).watch(function(error, event){console.log(event);})
var payResourceEvent = app.LogPayResource({},{}).watch(function(error, event){console.log(event);})

*********************************************************************************

* JOBS *

//create a new job
//from account 0
app.addJob('0xf17f52151EbEF6C7334FAD080c5704D77216b732', "Job 1", "desc 1", 101, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[0]})
app.addJob('0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef', "Job 2", "desc 2", 102, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[0]})
app.addJob('0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef', "Job 3", "desc 3", 103, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[0]})

//from account 1
app.addJob('0x627306090abaB3A6e1400e9345bC60c78a8BEf57', "Job 3", "desc 3", 51, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[1]})
app.addJob('0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef', "Job 4", "desc 4", 52, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[1]})

//from account 2
app.addJob('0x627306090abaB3A6e1400e9345bC60c78a8BEf57', "Job 5", "desc 5", 34, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[1]})
app.addJob('0xf17f52151EbEF6C7334FAD080c5704D77216b732', "Job 6", "desc 6", 35, web3.toWei(5, "ether"), "1/1/1", {from: web3.eth.accounts[1]})


//get all jobs length
app.getJobsLength()

//get unpaid jobs
//as admin
app.getUnpaidJobs(true, {from:web3.eth.accounts[0]})
app.getUnpaidJobs(true, {from:web3.eth.accounts[1]})
app.getUnpaidJobs(true, {from:web3.eth.accounts[2]})

//as client
app.getUnpaidJobs(false, {from:web3.eth.accounts[0]})
app.getUnpaidJobs(false, {from:web3.eth.accounts[1]})
app.getUnpaidJobs(false, {from:web3.eth.accounts[2]})


//get paid jobs
//as admin
app.getPaidJobs(true, {from:web3.eth.accounts[0]})
app.getPaidJobs(true, {from:web3.eth.accounts[1]})
app.getPaidJobs(true, {from:web3.eth.accounts[2]})

//as client
app.getPaidJobs(false, {from:web3.eth.accounts[0]})
app.getPaidJobs(false, {from:web3.eth.accounts[1]})
app.getPaidJobs(false, {from:web3.eth.accounts[2]})

//pay job
//account 1 jobs
app.payJob(1, "1/1/1", {from:web3.eth.accounts[1], value:web3.toWei(5, "ether")})
app.payJob(2, "1/1/1", {from:web3.eth.accounts[2], value:web3.toWei(5, "ether")})

//account 2 jobs
app.payJob(3, "1/1/1", {from:web3.eth.accounts[1], value:web3.toWei(5, "ether")})
app.payJob(4, "1/1/1", {from:web3.eth.accounts[2], value:web3.toWei(5, "ether")})

//account 3 jobs
app.payJob(5, "1/1/1", {from:web3.eth.accounts[1], value:web3.toWei(5, "ether")})
app.payJob(6, "1/1/1", {from:web3.eth.accounts[2], value:web3.toWei(5, "ether")})

//calculate totals -> in, due, out, owed
app.calculateTotals()

********************************************************************************

* EMPLOYEES *

//add new employee
app.addEmployee('0x821aEa9a577a9b44299B9c15c88cf3087F3b5544', "Ganache 4", web3.toWei(4, "ether"), "123 A Street A Place ACB123", "12345678911", {from:web3.eth.accounts[0]})
app.addEmployee('0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2', "Ganache 5", web3.toWei(4, "ether"), "123 A Street, A Place, ACB123", "12345678911", {from:web3.eth.accounts[0]})

//get number of employees
app.getEmployeeLength()

//get my employees
app.getMyEmployees({from:web3.eth.accounts[0]})

//pay employee
app.payEmployee(1, "2/2/2", {from:web3.eth.accounts[0], value:web3.toWei(4,"ether")})
app.payEmployee(2, "2/2/2", {from:web3.eth.accounts[0], value:web3.toWei(4,"ether")})

//edit salary
app.editSalary(1, web3.toWei(8,"ether"), {from:web3.eth.accounts[0]})
app.editSalary(2, web3.toWei(2,"ether"), {from:web3.eth.accounts[0]})

//pay employee after salary change
app.payEmployee(1, "2/2/2", {from:web3.eth.accounts[0], value:web3.toWei(8,"ether")})
app.payEmployee(2, "2/2/2", {from:web3.eth.accounts[0], value:web3.toWei(2,"ether")})


//update contact details
app.updateContactDetails(1, "456 B street B place EFG456", "9876543211")

********************************************************************************

* RESOURCES *

//add resource (not expense)
app.addResource('0xf17f52151EbEF6C7334FAD080c5704D77216b732', "name", "desc", web3.toWei(5,"ether"), 1, "1/1/1", false, "1/1/1", {from:web3.eth.accounts[0]})

//ad resrouce (expense)
app.addResource('0xf17f52151EbEF6C7334FAD080c5704D77216b732', "name", "desc", web3.toWei(5,"ether"), 1, "1/1/1", true, "1/1/1", {from:web3.eth.accounts[0]})


//get resources length
app.getResourceLength()

//get resources
//unpaid
app.getResources(false, {form:web3.eth.accounts[0]})
//paid
app.getResources(true, {form:web3.eth.accounts[0]})


//pay resources
app.payResource(1, "1/1/1", {from:web3.eth.accounts[0], value:web3.toWei(5,"ether")})



********************************************************************************

* EXPENSES *

//add admin expense
app.addAdminExpense("Expense 1", "Expense 1 descriptions", web3.toWei(3,"ether"), "1/1/1", {from:web3.eth.accounts[0]})
app.addAdminExpense("Expense 1", "Expense 1 descriptions", web3.toWei(3,"ether"), "1/1/1", {from:web3.eth.accounts[1]})

app.adminExpenses(1)

//get admin expenses
app.getAdminExpenses()

//claim employe expense
app.claimEmployeeExpense('0x627306090abaB3A6e1400e9345bC60c78a8BEf57', "Employee Expense", "Expense Description", web3.toWei(3,"ether"), "1/1/1", {from:web3.eth.accounts[1]})
app.employeeExpenses(1)

//get paid employee expenses
app.getEmployeeExpenses(true)
app.getEmployeeExpenses(false)

//pay employee expense
app.payEmployeeExpense(1, "1/1/1", {from:web3.eth.accounts[0], value: web3.toWei(3,"ether")}) 

//deny employee expense
app.denyEmployeeExpense(2, {from:web3.eth.accounts[0]})

//get total expenses
app.getTotalExpenses()

********************************************************************************












