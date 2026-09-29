// Homepage inquiry form.
// Sends the form to the submit-inquiry Supabase edge function, which saves it
// to the inquiries table and emails a copy to Ena.

(function() {
  var form = document.getElementById('inquire-form');
  if (!form || typeof HCHC_CONFIG === 'undefined') return;

  var ENDPOINT = HCHC_CONFIG.supabase.url + '/functions/v1/submit-inquiry';
  var FALLBACK_EMAIL = 'ena.dodski@hillcountryhomeconcepts.com';
  var button = form.querySelector('button[type="submit"]');
  var status = form.querySelector('.form-status');

  function showStatus(html, isError) {
    status.innerHTML = html;
    status.classList.toggle('is-error', !!isError);
    status.hidden = false;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var data = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      project_type: form.elements.project_type.value,
      timeline: form.elements.timeline.value,
      message: form.elements.message.value,
      website: form.elements.website.value,
      page: window.location.pathname
    };

    var buttonText = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Sending...';
    status.hidden = true;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function(res) {
        return res.json().catch(function() { return {}; }).then(function(body) {
          if (!res.ok) throw new Error(body.error || 'Request failed');
        });
      })
      .then(function() {
        form.reset();
        showStatus('Thank you. Your inquiry has been sent, and we will be in touch within 48 hours.', false);
      })
      .catch(function(err) {
        console.error('Inquiry failed:', err);
        showStatus('We are sorry. Your inquiry could not be sent. Please try again, or email us at <a href="mailto:' +
          FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.', true);
      })
      .then(function() {
        button.disabled = false;
        button.innerHTML = buttonText;
      });
  });
})();
