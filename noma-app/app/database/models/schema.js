import { appSchema, tableSchema } from "@nozbe/watermelondb/Schema";

export default appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'users',
            columns: [
                {name: 'full_name', type: 'string'},
                {name: 'phone', type: 'string'},
                {name: 'location', type: 'string'},
                {name: 'password', type: 'string'},
                {name: 'created_at', type: 'number'},
            ]
        }),
        tableSchema({
            name: 'diagnosis',
            columns: [
                {name: 'crop_name', type: 'string'},
                {name: 'disease_name', type: 'string'},
                {name: 'severity', type: 'string'},
                {name: 'confidence', type: 'string'},
                {name: 'recommended_treatment', type: 'string'},
                {name: 'future_prevention', type: 'string'},
                {name: 'created_at', type: 'number'},
            ]
        })
    ]
})