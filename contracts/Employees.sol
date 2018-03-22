pragma solidity ^0.4.18;

contract Employees {

  //employee data type structure
  struct Employee {
      uint256 employeeId;
      address admin;
      address employee;
      string name;
      uint256 salary;
      string lastPaidDate;
      string postalAddress;
      string phoneNumber;
  }

    //mapping assos array _> point to employee
    mapping(uint => Employee) public employees;
    uint employeeCounter;

    //modifyer, only allow admin of a job to pay an employee
    modifier onlyAdmin(uint _employeeId) {
      require(msg.sender == employees[_employeeId].admin);
      _;
    }

    //events
    event LogAddEmployee(
      uint256 indexed _employeeId,
      address indexed _admin,
      address indexed _employee,
      string _name,
      uint256 _salary
      );

    event LogPayEmployee(
      uint256 indexed _employeeId,
      address indexed _admin,
      address indexed employee,
      string _name,
      uint256 _salaryPaid,
      string _datePaid
      );

    event LogEditSalary(
      uint256 indexed _employeeId,
      string _name,
      uint256 _oldSalary,
      uint256 _newSalary
      );

      event LogUpdateContactDetails(
        uint256 indexed _employeeId,
        string _name,
        string _newAddress,
        string _newPhoneNumber
        );

    //add new employee function
    function addEmployee(address _employeeAddress, string _name, uint256 _salary, string _postalAddress, string _phoneNumber) public {
      employeeCounter++;

      //add the new employee
      employees[employeeCounter] = Employee (
        employeeCounter,
        msg.sender,
        _employeeAddress,
        _name,
        _salary,
        "",
        _postalAddress,
        _phoneNumber
        );

        //call event, pass employee details
        LogAddEmployee(employeeCounter, msg.sender, _employeeAddress, _name, _salary);
    }

    //get number of Employees
    function getEmployeeLength() public view returns(uint) {
      return employeeCounter;
    }

    //get employees function
    function getMyEmployees() public view returns (uint[]) {
      uint[] memory employeeIds = new uint[](employeeCounter);

      //counter
      uint employeeNo = 0;

      //iterate over Employees
      for(uint i = 1; i <= employeeCounter; i++) {
        if(employees[i].admin == msg.sender){
          employeeIds[employeeNo] = employees[i].employeeId;
          employeeNo++;
        }
      }

      //sort to smaller array
      uint[] memory sortEmployees = new uint[](employeeNo);

      for(uint j = 0; j < employeeNo; j++) {
        sortEmployees[j] = employeeIds[j];
      }

      //return the sorted array
      return sortEmployees;
    }

    //pay single employee function
    function payEmployee(uint _employeeId, string _date) payable onlyAdmin(_employeeId) public {

      //get the employee details from the mapping / check employee exists
      Employee storage emp = employees[_employeeId];

      //check the salary matches the Payment
      require(msg.value == emp.salary);

      //pay the employee
      emp.employee.transfer(msg.value);

      //store the payment date
      emp.lastPaidDate = _date;

      //trigger a payment event
      LogPayEmployee(_employeeId, emp.admin, emp.employee, emp.name, emp.salary, _date);

    }

    //edit salary function
    function editSalary(uint _employeeId, uint256 _salary) public {
      //get the employee
      Employee storage emp = employees[_employeeId];

      //update the employees salary
      uint256 oldSalary = emp.salary;                                           //call the event before changing to save declaring a variable,
      emp.salary = _salary;                                                     // tf saving gas

      //log the edited salary
      LogEditSalary(_employeeId, emp.name, oldSalary, emp.salary);

    }

    //update contact details function
    function updateContactDetails(uint _employeeId, string _postalAddress, string _phoneNumber) public {
      //get the employee
      Employee storage emp = employees[_employeeId];

      //update the contact details
      emp.postalAddress = _postalAddress;
      emp.phoneNumber = _phoneNumber;

      //log the updated contact details
      LogUpdateContactDetails(_employeeId, emp.name, _postalAddress, _phoneNumber);
    }


}
