pragma solidity ^0.4.18;

contract Expenses {

  //data type for admin declare expense
    struct AdminExpense{
      uint256 expenseId;
      address admin;
      string name;
      string description;
      uint256 total;
      string dateMade;
    }

    struct EmployeeExpense{
      uint256 expenseId;
      address employee;
      address employer;
      string name;
      string description;
      uint256 total;
      string dateMade;
      string datePaid;
      bool paid;
      bool denied;
    }

      //only allow "employer" (admin) to pay/deny an employees expense
      modifier onlyEmployer(uint256 employeeExpenseId){
        require(msg.sender == employeeExpenses[employeeExpenseId].employer);
        _;
      }

      //mapping for admin expense
      mapping (uint => AdminExpense) public adminExpenses;
      uint adminExpenseCounter;

      //mapping for employee expense
      mapping (uint => EmployeeExpense) public employeeExpenses;
      uint employeeExpenseCounter;

        //events
        event LogAddAdminExpense(
          uint256 indexed _expenseId,
          address indexed _admin,
          string _name,
          uint256 _total,
          string _dateMade
          );

        event LogEmployeeExpense(
          uint256 indexed _expenseId,
          address indexed _admin,
          address indexed _employer,
          string _name,
          uint256 _total,
          string _dateMade
          );

        event LogPayExpense(
          uint256 indexed _expenseId,
          string _name,
          string _datePaid
          );

        event LogDenyEmployeeExpense(
          uint256 indexed _expenseId,
          string _message
          );

      //add expense function                                                      //for optimisation contract holds funds and claim expense from contract ???
      function addAdminExpense(string _name, string _description, uint256 _total, string _dateMade) public {
        //increment the admin expense counter
        adminExpenseCounter++;

        //add the new admin expense
        adminExpenses[adminExpenseCounter] = AdminExpense(
          adminExpenseCounter,
          msg.sender,
          _name,
          _description,
          _total,
          _dateMade
          );

        //call event
        LogAddAdminExpense(adminExpenseCounter, msg.sender, _name, _total, _dateMade);
      }

      function claimEmployeeExpense(address _employer, string _name, string _description, uint256 _total, string _dateMade) public {
        //increment counter
        employeeExpenseCounter++;

        employeeExpenses[employeeExpenseCounter] = EmployeeExpense (
          employeeExpenseCounter,
          msg.sender,
          _employer,
          _name,
          _description,
          _total,
          _dateMade,
          "",
          false,
          false
          );

        //add expense
        LogEmployeeExpense(employeeExpenseCounter, msg.sender, _employer, _name, _total, _dateMade);
      }

      //get all admin expenses (paid or unpaid)
      function getAdminExpenses() public view returns (uint[]){
        //array to store initial sort
        uint[] memory expenseIds = new uint[](adminExpenseCounter);

        //counter for admin expenses
        uint adminExpenseNo = 0;

            //sort expenses
            for(uint i = 1; i <= adminExpenseCounter; i++){
              if(adminExpenses[i].admin == msg.sender){
              expenseIds[adminExpenseNo] = adminExpenses[i].expenseId;

              //increment the admin expense count
              adminExpenseNo++;
              }
            }

        //array for values for return
        uint[] memory sortedExpenseIds = new uint[](adminExpenseNo);
          //sort to correct size array
          for(uint j = 0; j < adminExpenseNo; j++) {
            sortedExpenseIds[j] = expenseIds[j];
          }

            //return the sorted admin expense ids array
            return sortedExpenseIds;
        }


      //get all employee expenses
      function getEmployeeExpenses(bool paid) public view returns (uint[]) {
        //array to store initial sort
        uint[] memory expenseIds = new uint[](employeeExpenseCounter);

        //counter for admin expenses
        uint employeeExpenseNo = 0;

            //sort expenses
            for(uint i = 1; i <= employeeExpenseCounter; i++){
              if(paid){
                if(employeeExpenses[i].paid && employeeExpenses[i].employer == msg.sender){
                  expenseIds[employeeExpenseNo] = employeeExpenses[i].expenseId;

                  //increment the admin expense count
                  employeeExpenseNo++;
                }
              }
              else if(!employeeExpenses[i].paid){
                if(!employeeExpenses[i].denied && employeeExpenses[i].employer == msg.sender){
                  expenseIds[employeeExpenseNo] = employeeExpenses[i].expenseId;

                  //increment the admin expense count
                  employeeExpenseNo++;
                }
              }

            }

            //array for values for return
            uint[] memory sortedExpenseIds = new uint[](employeeExpenseNo);
              //sort to correct size array
              for(uint j = 0; j < employeeExpenseNo; j++) {
                sortedExpenseIds[j] = expenseIds[j];
              }

                //return the sorted admin expense ids array
                return sortedExpenseIds;
            }


      //pay employee expense
      function payEmployeeExpense(uint _employeeExpenseId, string _date) payable onlyEmployer(_employeeExpenseId) public {

        //get the employee details from the mapping / check employee exists
        EmployeeExpense storage expense = employeeExpenses[_employeeExpenseId];

        //check the expense is valid
        require(expense.denied == false);

        //check the value matches the expense total
        require(msg.value == expense.total);

        //pay the employee
        expense.employee.transfer(msg.value);

        //store the payment date, set paid to true
        expense.datePaid = _date;
        expense.paid = true;

        //trigger a payment event
        LogPayExpense(_employeeExpenseId, expense.name, _date);

      }

      //deny employee expense claim
      function denyEmployeeExpense(uint _employeeExpenseId) onlyEmployer(_employeeExpenseId) public {

        //check the expense has not already been paid
        require(employeeExpenses[_employeeExpenseId].paid == false);

        //set the expense status to denied
        employeeExpenses[_employeeExpenseId].denied = true;

        //log deny employee expense
        LogDenyEmployeeExpense( _employeeExpenseId, "Expense Denied");

      }


      //get total Expenses
      function getTotalExpenses() public view returns(uint256) {

        //varaible for expenses total
        uint256 expenseTotal;

        //iterate expenses and add to running total
        for(uint i = 1; i <= adminExpenseCounter; i++) {
          if(adminExpenses[i].admin == msg.sender){
              expenseTotal += adminExpenses[i].total;
          }
        }

        //return total expense value
        return expenseTotal;

      }

      //pay tax function

}
