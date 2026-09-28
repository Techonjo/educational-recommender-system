import React, { useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function CourseSelector({ courses, selectedCourse, onSelectCourse }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCourses = courses.filter(c => 
    c.course_title.toLowerCase().includes(search.toLowerCase()) || 
    (c.course_id && c.course_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <div 
        className="input-field"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: isOpen ? 'var(--bg-surface)' : 'var(--bg-color)',
          borderColor: isOpen ? 'var(--accent-color)' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 2px var(--accent-glow)' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedCourse ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {selectedCourse ? selectedCourse.course_title : 'Select a course...'}
        </span>
        <ChevronDown size={20} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div className="card" style={{ 
          position: 'absolute', 
          top: 'calc(100% + 8px)', 
          left: 0, 
          right: 0, 
          zIndex: 50,
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '300px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search courses..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingBottom: '0.5rem', paddingTop: '0.5rem', fontSize: '0.875rem' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredCourses.length > 0 ? filteredCourses.map(course => (
              <div 
                key={course.course_id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: selectedCourse?.course_id === course.course_id ? 'var(--bg-surface-hover)' : 'transparent',
                  color: selectedCourse?.course_id === course.course_id ? 'var(--accent-color)' : 'var(--text-primary)'
                }}
                onMouseEnter={e => {
                  if (selectedCourse?.course_id !== course.course_id) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCourse?.course_id !== course.course_id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => {
                  onSelectCourse(course);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{course.course_title}</div>
                  {course.course_id && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{course.course_id}</div>}
                </div>
                {selectedCourse?.course_id === course.course_id && <Check size={16} />}
              </div>
            )) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No courses found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
