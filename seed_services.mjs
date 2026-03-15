
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrpwwzzcnwmmkjugajyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycHd3enpjbndtbWtqdWdhanluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjgxNzUsImV4cCI6MjA4Njg0NDE3NX0.HpdoYr1FKFQSa-aRt4-10MWJXPLY-3vHnnqnstWAzmI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedServices() {
    const services = [
        { name: 'Tiền điện', amount: 1700, unit: 'usage', description: 'Tính theo số ký điện sử dụng' },
        { name: 'Tiền nước', amount: 18000, unit: 'person', description: 'Tính theo đầu người' },
        { name: 'Tiền rác', amount: 15000, unit: 'month', description: 'Phí cố định hàng tháng' },
        { name: 'Tiền wifi', amount: 50000, unit: 'person', description: 'Phí wifi theo đầu người' }
    ];

    console.log('Inserting services...');
    // Clear existing rates if any, or just insert
    const { data: existing } = await supabase.from('service_rates').select('id');
    if (existing && existing.length > 0) {
        console.log('Clearing existing services...');
        await supabase.from('service_rates').delete().in('id', existing.map(e => e.id));
    }

    const { data, error } = await supabase
        .from('service_rates')
        .insert(services)
        .select();

    if (error) {
        console.error('Error inserting services:', error);
    } else {
        console.log('Services inserted successfully:', data);
    }
}

seedServices();
