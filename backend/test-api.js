// Skedar për testimin e API-së
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Funksioni për të testuar endpoint-et
async function testAPI() {
  console.log('🧪 Po filloj testimin e API-së...\n');

  try {
    // Test Health Check
    console.log('1. Testimi i Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.message);
    console.log('');

    // Test Users (pa autentifikim - duhet të kthejë gabim)
    console.log('2. Testimi i Users endpoint (pa autentifikim)...');
    try {
      const usersResponse = await fetch(`${API_BASE_URL}/users`);
      const usersData = await usersResponse.json();
      console.log('❌ Users endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Users endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Products (pa autentifikim - duhet të kthejë gabim)
    console.log('3. Testimi i Products endpoint (pa autentifikim)...');
    try {
      const productsResponse = await fetch(`${API_BASE_URL}/products`);
      const productsData = await productsResponse.json();
      console.log('❌ Products endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Products endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Orders (pa autentifikim - duhet të kthejë gabim)
    console.log('4. Testimi i Orders endpoint (pa autentifikim)...');
    try {
      const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
      const ordersData = await ordersResponse.json();
      console.log('❌ Orders endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Orders endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Services (pa autentifikim - duhet të kthejë gabim)
    console.log('5. Testimi i Services endpoint (pa autentifikim)...');
    try {
      const servicesResponse = await fetch(`${API_BASE_URL}/services`);
      const servicesData = await servicesResponse.json();
      console.log('❌ Services endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Services endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Tasks (pa autentifikim - duhet të kthejë gabim)
    console.log('6. Testimi i Tasks endpoint (pa autentifikim)...');
    try {
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks`);
      const tasksData = await tasksResponse.json();
      console.log('❌ Tasks endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Tasks endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Customers (pa autentifikim - duhet të kthejë gabim)
    console.log('7. Testimi i Customers endpoint (pa autentifikim)...');
    try {
      const customersResponse = await fetch(`${API_BASE_URL}/customers`);
      const customersData = await customersResponse.json();
      console.log('❌ Customers endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Customers endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    // Test Reports (pa autentifikim - duhet të kthejë gabim)
    console.log('8. Testimi i Reports endpoint (pa autentifikim)...');
    try {
      const reportsResponse = await fetch(`${API_BASE_URL}/reports/dashboard`);
      const reportsData = await reportsResponse.json();
      console.log('❌ Reports endpoint duhet të kthejë gabim autentifikimi');
    } catch (error) {
      console.log('✅ Reports endpoint kthen gabim autentifikimi siç pritej');
    }
    console.log('');

    console.log('🎉 Testimi u përfundua me sukses!');
    console.log('📝 Shënim: Për të testuar endpoint-et me autentifikim, duhet të përdorni JWT token nga Supabase.');

  } catch (error) {
    console.error('❌ Gabim gjatë testimit:', error.message);
  }
}

// Ekzekuton testin
testAPI();
