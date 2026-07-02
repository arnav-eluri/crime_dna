-- Police FIR Database Schema Creation
-- Based on the provided ER Diagram

CREATE TABLE State (
    StateID INTEGER PRIMARY KEY AUTOINCREMENT,
    StateName VARCHAR,
    NationalityID INTEGER,
    Active BIT
);

CREATE TABLE District (
    DistrictID INTEGER PRIMARY KEY AUTOINCREMENT,
    DistrictName VARCHAR,
    StateID INTEGER,
    Active BIT,
    FOREIGN KEY (StateID) REFERENCES State(StateID)
);

CREATE TABLE UnitType (
    UnitTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
    UnitTypeName VARCHAR,
    CityDistState VARCHAR,
    Hierarchy INTEGER,
    Active BIT
);

CREATE TABLE Unit (
    UnitID INTEGER PRIMARY KEY AUTOINCREMENT,
    UnitName VARCHAR,
    TypeID INTEGER,
    ParentUnit INTEGER,
    NationalityID INTEGER,
    StateID INTEGER,
    DistrictID INTEGER,
    Active BIT,
    FOREIGN KEY (TypeID) REFERENCES UnitType(UnitTypeID),
    FOREIGN KEY (StateID) REFERENCES State(StateID),
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID)
);

CREATE TABLE Rank (
    RankID INTEGER PRIMARY KEY AUTOINCREMENT,
    RankName VARCHAR,
    Hierarchy INTEGER,
    Active BIT
);

CREATE TABLE Designation (
    DesignationID INTEGER PRIMARY KEY AUTOINCREMENT,
    DesignationName VARCHAR,
    Active BIT,
    SortOrder INTEGER
);

CREATE TABLE Employee (
    EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
    DistrictID INTEGER,
    UnitID INTEGER,
    RankID INTEGER,
    DesignationID INTEGER,
    KGID VARCHAR,
    FirstName VARCHAR,
    EmployeeDOB DATE,
    GenderID INTEGER,
    BloodGroupID INTEGER,
    PhysicallyChallenged BIT,
    AppointmentDate DATE,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (UnitID) REFERENCES Unit(UnitID),
    FOREIGN KEY (RankID) REFERENCES Rank(RankID),
    FOREIGN KEY (DesignationID) REFERENCES Designation(DesignationID)
);

CREATE TABLE CaseCategory (
    CaseCategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    LookupValue VARCHAR
);

CREATE TABLE GravityOffence (
    GravityOffenceID INTEGER PRIMARY KEY AUTOINCREMENT,
    LookupValue VARCHAR
);

CREATE TABLE CrimeHead (
    CrimeHeadID INTEGER PRIMARY KEY AUTOINCREMENT,
    CrimeGroupName VARCHAR,
    Active BIT
);

CREATE TABLE CrimeSubHead (
    CrimeSubHeadID INTEGER PRIMARY KEY AUTOINCREMENT,
    CrimeHeadID INTEGER,
    CrimeHeadName VARCHAR,
    SeqID INTEGER,
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
);

CREATE TABLE CaseStatusMaster (
    CaseStatusID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseStatusName VARCHAR
);

CREATE TABLE Court (
    CourtID INTEGER PRIMARY KEY AUTOINCREMENT,
    CourtName VARCHAR,
    DistrictID INTEGER,
    StateID INTEGER,
    Active BIT,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (StateID) REFERENCES State(StateID)
);

CREATE TABLE CaseMaster (
    CaseMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CrimeNo VARCHAR,
    CaseNo VARCHAR,
    CrimeRegisteredDate DATE,
    PolicePersonID INTEGER,
    PoliceStationID INTEGER,
    CaseCategoryID INTEGER,
    GravityOffenceID INTEGER,
    CrimeMajorHeadID INTEGER,
    CrimeMinorHeadID INTEGER,
    CaseStatusID INTEGER,
    CourtID INTEGER,
    IncidentFromDate DATETIME,
    IncidentToDate DATETIME,
    InfoReceivedPSDate DATETIME,
    latitude DECIMAL,
    longitude DECIMAL,
    BriefFacts TEXT,
    FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    FOREIGN KEY (CaseCategoryID) REFERENCES CaseCategory(CaseCategoryID),
    FOREIGN KEY (GravityOffenceID) REFERENCES GravityOffence(GravityOffenceID),
    FOREIGN KEY (CrimeMajorHeadID) REFERENCES CrimeHead(CrimeHeadID),
    FOREIGN KEY (CrimeMinorHeadID) REFERENCES CrimeSubHead(CrimeSubHeadID),
    FOREIGN KEY (CaseStatusID) REFERENCES CaseStatusMaster(CaseStatusID),
    FOREIGN KEY (CourtID) REFERENCES Court(CourtID)
);

CREATE TABLE CasteMaster (
    caste_master_id INTEGER PRIMARY KEY AUTOINCREMENT,
    caste_master_name VARCHAR
);

CREATE TABLE ReligionMaster (
    ReligionID INTEGER PRIMARY KEY AUTOINCREMENT,
    ReligionName VARCHAR
);

CREATE TABLE OccupationMaster (
    OccupationID INTEGER PRIMARY KEY AUTOINCREMENT,
    OccupationName VARCHAR
);

CREATE TABLE ComplainantDetails (
    ComplainantID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER,
    ComplainantName VARCHAR,
    AgeYear INTEGER,
    OccupationID INTEGER,
    ReligionID INTEGER,
    CasteID INTEGER,
    GenderID INTEGER,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (OccupationID) REFERENCES OccupationMaster(OccupationID),
    FOREIGN KEY (ReligionID) REFERENCES ReligionMaster(ReligionID),
    FOREIGN KEY (CasteID) REFERENCES CasteMaster(caste_master_id)
);

CREATE TABLE Act (
    ActCode VARCHAR PRIMARY KEY,
    ActDescription VARCHAR,
    ShortName VARCHAR,
    Active BIT
);

CREATE TABLE Section (
    ActCode VARCHAR,
    SectionCode VARCHAR,
    SectionDescription VARCHAR,
    Active BIT,
    PRIMARY KEY (ActCode, SectionCode),
    FOREIGN KEY (ActCode) REFERENCES Act(ActCode)
);

CREATE TABLE ActSectionAssociation (
    CaseMasterID INTEGER,
    ActID VARCHAR,
    SectionID VARCHAR,
    ActOrderID INTEGER,
    SectionOrderID INTEGER,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (ActID) REFERENCES Act(ActCode)
);

CREATE TABLE Victim (
    VictimMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER,
    VictimName VARCHAR,
    AgeYear INTEGER,
    GenderID INTEGER,
    VictimPolice VARCHAR,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
);

CREATE TABLE Accused (
    AccusedMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER,
    AccusedName VARCHAR,
    AgeYear INTEGER,
    GenderID INTEGER,
    PersonID VARCHAR,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
);

CREATE TABLE ArrestSurrender (
    ArrestSurrenderID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER,
    ArrestSurrenderTypeID INTEGER,
    ArrestSurrenderDate DATE,
    ArrestSurrenderStateId INTEGER,
    ArrestSurrenderDistrictId INTEGER,
    PoliceStationID INTEGER,
    IOID INTEGER,
    CourtID INTEGER,
    AccusedMasterID INTEGER,
    IsAccused BIT,
    IsComplainantAccused BIT,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (ArrestSurrenderStateId) REFERENCES State(StateID),
    FOREIGN KEY (ArrestSurrenderDistrictId) REFERENCES District(DistrictID),
    FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    FOREIGN KEY (IOID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (CourtID) REFERENCES Court(CourtID),
    FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID)
);

CREATE TABLE CrimeHeadActSection (
    CrimeHeadID INTEGER,
    ActCode VARCHAR,
    SectionCode VARCHAR,
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID),
    FOREIGN KEY (ActCode) REFERENCES Act(ActCode)
);

CREATE TABLE ChargesheetDetails (
    CSID INTEGER PRIMARY KEY AUTOINCREMENT,
    CaseMasterID INTEGER,
    csdate DATETIME,
    cstype CHAR,
    PolicePersonID INTEGER,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE inv_arrestsurrenderaccused (
    ArrestSurrenderID INTEGER,
    AccusedMasterID INTEGER,
    FOREIGN KEY (ArrestSurrenderID) REFERENCES ArrestSurrender(ArrestSurrenderID),
    FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID)
);
