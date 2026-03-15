/*
    FULL RESET FOR FITFOCUS TABLES
    1) Drop FKs connected to any table with FitFocus_ prefix
    2) Drop all tables with FitFocus_ prefix
    3) Recreate current FitFocus schema
*/

DECLARE @DropFkSql NVARCHAR(MAX) = N'';
DECLARE @DropTableSql NVARCHAR(MAX) = N'';

SELECT @DropFkSql = @DropFkSql +
    N'ALTER TABLE [' + SCHEMA_NAME(pt.schema_id) + N'].[' + pt.name + N'] DROP CONSTRAINT [' + fk.name + N'];' + CHAR(10)
FROM sys.foreign_keys fk
INNER JOIN sys.tables pt ON fk.parent_object_id = pt.object_id
INNER JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
WHERE pt.name LIKE N'FitFocus[_]%' OR rt.name LIKE N'FitFocus[_]%';

IF LEN(@DropFkSql) > 0
BEGIN
    EXEC sp_executesql @DropFkSql;
END;

SELECT @DropTableSql = @DropTableSql +
    N'DROP TABLE [' + SCHEMA_NAME(t.schema_id) + N'].[' + t.name + N'];' + CHAR(10)
FROM sys.tables t
WHERE t.name LIKE N'FitFocus[_]%';

IF LEN(@DropTableSql) > 0
BEGIN
    EXEC sp_executesql @DropTableSql;
END;

IF OBJECT_ID('dbo.FitFocus_UsersApp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FitFocus_UsersApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(200) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(400) NOT NULL,
        FullName NVARCHAR(120) NOT NULL,
        DateOfBirth DATE NULL,
        HeightCm DECIMAL(6,2) NULL,
        WeightKg DECIMAL(6,2) NULL,
        Gender NVARCHAR(20) NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'User',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );
END;

IF OBJECT_ID('dbo.FitFocus_DailyLogsApp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FitFocus_DailyLogsApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        LogDate DATE NOT NULL,
        MoodScore INT NOT NULL,
        SleepHours DECIMAL(4,2) NOT NULL,
        Symptoms NVARCHAR(1000) NULL,
        Notes NVARCHAR(1000) NULL,
        StressScore INT NOT NULL DEFAULT 5,
        WaterLiters DECIMAL(4,2) NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_FitFocus_DailyLogsApp_UsersApp FOREIGN KEY (UserId) REFERENCES dbo.FitFocus_UsersApp(Id),
        CONSTRAINT UQ_FitFocus_DailyLogsApp_UserDate UNIQUE (UserId, LogDate)
    );
END;

IF OBJECT_ID('dbo.FitFocus_MealsApp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FitFocus_MealsApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        DailyLogId INT NULL,
        MealType NVARCHAR(40) NOT NULL,
        MealName NVARCHAR(120) NOT NULL,
        Calories INT NULL,
        ProteinGrams DECIMAL(6,2) NULL,
        CarbsGrams DECIMAL(6,2) NULL,
        FatGrams DECIMAL(6,2) NULL,
        ImageUrl NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_FitFocus_MealsApp_UsersApp FOREIGN KEY (UserId) REFERENCES dbo.FitFocus_UsersApp(Id),
        CONSTRAINT FK_FitFocus_MealsApp_DailyLogsApp FOREIGN KEY (DailyLogId) REFERENCES dbo.FitFocus_DailyLogsApp(Id)
    );
END;

IF OBJECT_ID('dbo.FitFocus_MedicationRemindersApp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FitFocus_MedicationRemindersApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        MedicationName NVARCHAR(120) NOT NULL,
        Dosage NVARCHAR(120) NOT NULL,
        ReminderTime TIME NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_FitFocus_RemindersApp_UsersApp FOREIGN KEY (UserId) REFERENCES dbo.FitFocus_UsersApp(Id)
    );
END;

IF OBJECT_ID('dbo.FitFocus_DeviceTokensApp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FitFocus_DeviceTokensApp (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        ExpoPushToken NVARCHAR(300) NOT NULL,
        DeviceName NVARCHAR(120) NULL,
        LastSeenAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_FitFocus_DeviceTokensApp_UserToken UNIQUE (UserId, ExpoPushToken),
        CONSTRAINT FK_FitFocus_DeviceTokensApp_UsersApp FOREIGN KEY (UserId) REFERENCES dbo.FitFocus_UsersApp(Id)
    );
END;
