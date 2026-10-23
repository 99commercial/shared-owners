import ContactForm from '../../../sections/contact/ContactForm';
import ContactInfo from '../../../sections/contact/ContactInfo';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
        <p className="text-gray-500 mt-3 max-w-xl mx-auto">Have questions about shared ownership? We're here to help.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-14">
        <ContactForm />
        <ContactInfo />
      </div>
    </div>
  );
}
