// Homepage inquiry forms (the main contact form, the builder inquiry form,
// and the designer waitlist form).
// Each sends to the Supabase edge function named rapid-responder, which saves it
// to the inquiries table and emails a copy to Ena.

(function() {
  if (typeof HCHC_CONFIG === 'undefined') return;

  var ENDPOINT = HCHC_CONFIG.supabase.url + '/functions/v1/rapid-responder';
  var FALLBACK_EMAIL = 'ena.dodski@hillcountryhomeconcepts.com';
  var DEFAULT_SUCCESS = 'Thank you. Your inquiry has been sent, and we will be in touch within 48 hours.';

  function value(form, name) {
    var field = form.elements[name];
    return field ? field.value : '';
  }

  function setup(form) {
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.form-status');

    function showStatus(html, isError) {
      status.innerHTML = html;
      status.classList.toggle('is-error', !!isError);
      status.hidden = false;
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // The builder and designer forms collect a company name; keep it with the message
      var message = value(form, 'message');
      var company = value(form, 'company').trim();
      if (company) message = 'Company: ' + company + (message ? '\n\n' + message : '');

      var data = {
        name: value(form, 'name'),
        email: value(form, 'email'),
        project_type: value(form, 'project_type'),
        timeline: value(form, 'timeline'),
        message: message,
        website: value(form, 'website'),
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
          showStatus(form.getAttribute('data-success') || DEFAULT_SUCCESS, false);
        })
        .catch(function(err) {
          console.error('Inquiry failed:', err);
          showStatus('We are sorry. Your message could not be sent. Please try again, or email us at <a href="mailto:' +
            FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.', true);
        })
        .then(function() {
          button.disabled = false;
          button.innerHTML = buttonText;
        });
    });
  }

  var forms = document.querySelectorAll('#inquire-form, .js-inquiry-form');
  Array.prototype.forEach.call(forms, setup);

  // "Request This Bundle" buttons preselect the bundle in the main contact form
  var bundleSelect = document.getElementById('contact-type');
  if (bundleSelect) {
    document.querySelectorAll('[data-bundle]').forEach(function(link) {
      link.addEventListener('click', function() {
        bundleSelect.value = link.getAttribute('data-bundle');
      });
    });
  }
})();
