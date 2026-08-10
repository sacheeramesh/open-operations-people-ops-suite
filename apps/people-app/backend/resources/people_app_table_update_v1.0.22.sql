-- =====================================================================
-- people_app_table_update_v1.0.22.sql
-- Adds employee.external_designation and threads it through the audit path.
--
-- prc_employee_audit is invoked POSITIONALLY from both employee audit
-- triggers, so the new parameter must occupy the same ordinal position in
-- the procedure signature and in both CALL argument lists. A mismatch would
-- silently shift every subsequent argument and corrupt the audit JSON for
-- unrelated columns without raising an error. A procedure's signature cannot
-- be altered in place, so the procedure and both triggers are dropped and
-- recreated below. The DDL here is identical to people_app_creation.sql.
--
-- Runs against a database already at v1.0.21.
-- =====================================================================

ALTER TABLE `employee`
  ADD COLUMN `external_designation` VARCHAR(100) NULL AFTER `job_role`;

-- Triggers are dropped before the procedure they call, then recreated after it.
DROP TRIGGER IF EXISTS `trg_employee_audit_insert`;
DROP TRIGGER IF EXISTS `trg_employee_audit_update`;
DROP PROCEDURE IF EXISTS `prc_employee_audit`;

-- Procedure: prc_employee_audit
DELIMITER //
CREATE PROCEDURE `prc_employee_audit`(
  IN p_id                        BIGINT,
  IN p_action_type               VARCHAR(10),
  IN p_action_by                 VARCHAR(254),
  IN p_employee_id               VARCHAR(50),
  IN p_first_name                VARCHAR(100),
  IN p_last_name                 VARCHAR(100),
  IN p_epf                       VARCHAR(50),
  IN p_work_location             VARCHAR(100),
  IN p_work_phone                VARCHAR(20),
  IN p_relocation_status         VARCHAR(100),
  IN p_work_email                VARCHAR(254),
  IN p_start_date                DATE,
  IN p_secondary_job_title       VARCHAR(100),
  IN p_job_role                  VARCHAR(100),
  IN p_external_designation      VARCHAR(100),
  IN p_manager_email             VARCHAR(254),
  IN p_employee_status           VARCHAR(50),
  IN p_continuous_service_record VARCHAR(99),
  IN p_employee_thumbnail        VARCHAR(2048),
  IN p_probation_end_date        DATE,
  IN p_last_promoted_date        DATE,
  IN p_agreement_end_date        DATE,
  IN p_employment_type_id        BIGINT,
  IN p_designation_id            BIGINT,
  IN p_company_id                BIGINT,
  IN p_office_id                 BIGINT,
  IN p_team_id                   BIGINT,
  IN p_sub_team_id               BIGINT,
  IN p_business_unit_id          BIGINT,
  IN p_unit_id                   BIGINT,
  IN p_house_id                  BIGINT,
  IN p_personal_info_id          BIGINT,
  IN p_created_by                VARCHAR(254),
  IN p_created_on                DATETIME(6),
  IN p_updated_by                VARCHAR(254),
  IN p_updated_on                DATETIME(6)
)
BEGIN
  INSERT INTO employee_audit (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    p_id,
    p_action_type,
    p_action_by,
    USER(),
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id',                        p_id,
      'employee_id',               p_employee_id,
      'first_name',                p_first_name,
      'last_name',                 p_last_name,
      'epf',                       p_epf,
      'work_location',             p_work_location,
      'work_phone',                p_work_phone,
      'relocation_status',         p_relocation_status,
      'work_email',                p_work_email,
      'start_date',                p_start_date,
      'secondary_job_title',       p_secondary_job_title,
      'job_role',                  p_job_role,
      'external_designation',      p_external_designation,
      'manager_email',             p_manager_email,
      'employee_status',           p_employee_status,
      'continuous_service_record', p_continuous_service_record,
      'employee_thumbnail',        p_employee_thumbnail,
      'probation_end_date',        p_probation_end_date,
      'last_promoted_date',        p_last_promoted_date,
      'agreement_end_date',        p_agreement_end_date,
      'employment_type_id',        p_employment_type_id,
      'designation_id',            p_designation_id,
      'company_id',                p_company_id,
      'office_id',                 p_office_id,
      'team_id',                   p_team_id,
      'sub_team_id',               p_sub_team_id,
      'business_unit_id',          p_business_unit_id,
      'unit_id',                   p_unit_id,
      'house_id',                  p_house_id,
      'personal_info_id',          p_personal_info_id,
      'created_by',                p_created_by,
      'created_on',                p_created_on,
      'updated_by',                p_updated_by,
      'updated_on',                p_updated_on
    )
  );
END//
DELIMITER ;

-- Trigger: trg_employee_audit_insert
DELIMITER //
CREATE TRIGGER `trg_employee_audit_insert`
AFTER INSERT ON `employee`
FOR EACH ROW
BEGIN
  CALL prc_employee_audit(
    NEW.id, 'INSERT', COALESCE(NULLIF(TRIM(NEW.created_by), ''), 'SYSTEM'),
    NEW.employee_id,               NEW.first_name,          NEW.last_name,
    NEW.epf,                       NEW.work_location,        NEW.work_phone,
    NEW.relocation_status,         NEW.work_email,           NEW.start_date,
    NEW.secondary_job_title,       NEW.job_role,             NEW.external_designation,
    NEW.manager_email,             NEW.employee_status,
    NEW.continuous_service_record, NEW.employee_thumbnail,
    NEW.probation_end_date,        NEW.last_promoted_date,   NEW.agreement_end_date,
    NEW.employment_type_id,        NEW.designation_id,       NEW.company_id,
    NEW.office_id,                 NEW.team_id,              NEW.sub_team_id,
    NEW.business_unit_id,          NEW.unit_id,              NEW.house_id,
    NEW.personal_info_id,
    NEW.created_by,                NEW.created_on,
    NEW.updated_by,                NEW.updated_on
  );
END//
DELIMITER ;

-- Trigger: trg_employee_audit_update
DELIMITER //
CREATE TRIGGER `trg_employee_audit_update`
AFTER UPDATE ON `employee`
FOR EACH ROW
BEGIN
  CALL prc_employee_audit(
    NEW.id, 'UPDATE', COALESCE(NULLIF(TRIM(NEW.updated_by), ''), 'SYSTEM'),
    NEW.employee_id,               NEW.first_name,          NEW.last_name,
    NEW.epf,                       NEW.work_location,        NEW.work_phone,
    NEW.relocation_status,         NEW.work_email,           NEW.start_date,
    NEW.secondary_job_title,       NEW.job_role,             NEW.external_designation,
    NEW.manager_email,             NEW.employee_status,
    NEW.continuous_service_record, NEW.employee_thumbnail,
    NEW.probation_end_date,        NEW.last_promoted_date,   NEW.agreement_end_date,
    NEW.employment_type_id,        NEW.designation_id,       NEW.company_id,
    NEW.office_id,                 NEW.team_id,              NEW.sub_team_id,
    NEW.business_unit_id,          NEW.unit_id,              NEW.house_id,
    NEW.personal_info_id,
    NEW.created_by,                NEW.created_on,
    NEW.updated_by,                NEW.updated_on
  );
END//
DELIMITER ;
