import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayCircleIcon, Clock01Icon, LanguageSquareIcon, StarIcon, UserGroupIcon, Book02Icon, Certificate01Icon } from '@hugeicons/core-free-icons';
import { fetchCourses } from '../api';

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const hours = (sec) => (sec >= 3600 ? `${Math.floor(sec / 3600)} hrs` : `${Math.max(Math.round(sec / 60), 1)} min`);
const generic = (name) => !name || /^instructor$/i.test(name.trim()); // "Instructor" is a placeholder, not a name

function Thumb({ course }) {
  const [broken, setBroken] = useState(!course.thumbnail_url);
  return (
    <div className="course-thumb">
      {!broken ? (
        <img src={course.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <div className="course-thumb-fallback"><HugeiconsIcon icon={Book02Icon} size={44} strokeWidth={1.2} /></div>
      )}
      {course.category && <span className="course-cat">{course.category}</span>}
    </div>
  );
}

function CourseCard({ c, onOpen }) {
  const certExtra = c.certificate_with_price > c.price ? c.certificate_with_price : null;
  return (
    <article className="course-card">
      <button type="button" className="course-open" onClick={onOpen} aria-label={`View details of ${c.title}`}><Thumb course={c} /></button>
      <div className="course-body">
        <h3><button type="button" className="course-title-btn" onClick={onOpen}>{c.title}</button></h3>
        {!generic(c.instructor_name) && <span className="course-by">By {c.instructor_name}</span>}
        {c.description && <p className="course-desc">{c.description}</p>}

        <ul className="course-meta">
          {c.videos > 0 && <li><HugeiconsIcon icon={PlayCircleIcon} size={16} strokeWidth={1.6} />{c.videos} lessons</li>}
          {c.duration_seconds > 0 && <li><HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={1.6} />{hours(c.duration_seconds)}</li>}
          {c.language && <li><HugeiconsIcon icon={LanguageSquareIcon} size={16} strokeWidth={1.6} />{c.language}</li>}
          {c.students > 0 && <li><HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={1.6} />{c.students} students</li>}
        </ul>

        <div className="course-foot">
          <div className="course-price">
            <strong>{c.price > 0 ? money(c.price) : 'Free'}</strong>
            {certExtra && <small><HugeiconsIcon icon={Certificate01Icon} size={14} strokeWidth={1.6} /> {money(certExtra)} with certificate</small>}
          </div>
          {c.review_count > 0 && (
            <span className="course-rating" title={`${c.avg_rating} from ${c.review_count} reviews`}>
              <HugeiconsIcon icon={StarIcon} size={16} strokeWidth={1.6} />{Number(c.avg_rating).toFixed(1)} <small>({c.review_count})</small>
            </span>
          )}
        </div>
        <button type="button" className="btn-solid course-view" onClick={onOpen}>View course</button>
      </div>
    </article>
  );
}

export default function CourseList({ onOpen }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' });
  useEffect(() => {
    fetchCourses().then((r) => setState({ loading: false, items: r.data, error: '' })).catch((e) => setState({ loading: false, items: [], error: e.message }));
  }, []);

  return (
    <section className="course-list-section" aria-labelledby="courses-title">
      <div className="section-head left">
        <div>
          <span className="eyebrow">Start learning</span>
          <h2 id="courses-title">Available courses</h2>
        </div>
        {!state.loading && state.items.length > 0 && <span className="count-note">{state.items.length} {state.items.length === 1 ? 'course' : 'courses'}</span>}
      </div>

      {state.error && <p className="designs-msg error">Couldn’t load the courses ({state.error}). Please try again.</p>}
      {!state.loading && !state.error && state.items.length === 0 && <p className="designs-msg">No courses are open right now. Please check back soon.</p>}

      <div className="course-grid">
        {state.loading && <div className="course-card skeleton" aria-hidden="true"><div className="course-thumb" /><div className="course-body"><i /><i /><i /></div></div>}
        {state.items.map((c) => <CourseCard key={c.id} c={c} onOpen={() => onOpen(c.id)} />)}
      </div>
    </section>
  );
}
