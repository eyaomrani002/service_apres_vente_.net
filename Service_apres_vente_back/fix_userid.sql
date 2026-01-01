USE ClientApiDB;
BEGIN TRAN;

-- Preview (vérifiez d'abord)
SELECT c.Id, c.Email, c.UserId AS OldUserId, u.Id AS AuthUserId, u.Email AS AuthEmail
FROM dbo.Clients c
INNER JOIN AuthJwtDB.dbo.AspNetUsers u ON LOWER(c.Email) = LOWER(u.Email)
WHERE c.UserId IS NULL OR c.UserId = '';

-- Apply update
UPDATE c
SET c.UserId = u.Id
FROM dbo.Clients c
INNER JOIN AuthJwtDB.dbo.AspNetUsers u ON LOWER(c.Email) = LOWER(u.Email)
WHERE (c.UserId IS NULL OR c.UserId = '');

COMMIT TRAN;
