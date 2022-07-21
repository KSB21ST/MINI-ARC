CREATE TABLE logs (
    id              INTEGER         PRIMARY KEY     AUTOINCREMENT   ,
    task_id         TEXT            NOT NULL                        ,
    user_id         TEXT            NOT NULL                        ,
    action_sequence TEXT            NOT NULL
)