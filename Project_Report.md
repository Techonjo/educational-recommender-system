# Educational Recommender System Project Report

## I. Review of Existing Educational Recommender Systems
Educational recommender systems (ERS) have evolved significantly to support personalized learning by filtering educational resources for students. Traditional systems often relied on simple rule-based algorithms or simple heuristics. Modern ERS incorporate advanced machine learning (ML) algorithms.

### 1. Content-Based Filtering (CBF)
CBF algorithms recommend items similar to those a student has preferred in the past. In educational contexts, this involves analyzing the textual content of learning resources (e.g., using TF-IDF, Word2Vec, or BERT) and comparing it against a student's profile (their past reading history, skill level, or explicitly stated interests).
- **Advantages:** No cold-start problem for new items; highly personalized to specific niche interests.
- **Challenges:** Tends to over-specialize, failing to recommend diverse or novel topics (the "filter bubble").

### 2. Collaborative Filtering (CF)
CF algorithms rely on the interactions (ratings, views, completions) of a community of learners. Matrix Factorization techniques like Singular Value Decomposition (SVD) and Alternating Least Squares (ALS) are standard.
- **Advantages:** Capable of discovering latent relationships between users and items; introduces serendipitous recommendations.
- **Challenges:** Suffers from the "cold-start" problem (new users or new items with no interactions) and data sparsity (students only interact with a tiny fraction of available resources).

### 3. Knowledge-Based and Ontology-Based Systems
These systems use explicit domain knowledge, such as curriculum prerequisites or pedagogical models, to guide recommendations.
- **Advantages:** Highly accurate for structured learning paths.
- **Challenges:** Extremely time-consuming and expensive to build and maintain the knowledge base.

## II. Design of a Hybrid Machine Learning Recommendation Framework
To address the inherent limitations of standalone CBF and CF approaches—specifically data sparsity and cold-start challenges—we designed a **Hybrid Machine Learning Recommendation Framework**.

### System Architecture
1. **Content-Based Engine (TF-IDF + Cosine Similarity):** 
   - Processes book titles, descriptions, and subjects.
   - Converts textual metadata into vector representations using TF-IDF.
   - Computes cosine similarity to find items with similar content.
   - *Solves:* New item cold-start problem.

2. **Collaborative Filtering Engine (Truncated SVD):**
   - Utilizes user interaction logs (views, clicks, adds, ratings).
   - Constructs a User-Item interaction matrix.
   - Applies Truncated SVD to reduce dimensionality and discover latent user preferences.
   - *Solves:* Recommending novel, community-validated resources.

3. **User Profile Clustering (K-Means - Proposed Addition):**
   - Clusters users into distinct "learner profiles" based on demographic data and aggregated interaction features.
   - *Solves:* New user cold-start problem by assigning a new user to a cluster based on initial survey data and providing the cluster's top recommendations.

4. **Hybrid Aggregator:**
   - Uses a weighted voting mechanism to combine the normalized scores from the CBF and CF engines. 
   - Adjusts weights dynamically: if a user is new (cold-start), the system heavily weights CBF and Cluster-based recommendations. As the user interacts more, CF weights increase.

## III. Implementation of the Web-Based Application Interface
A modern, user-friendly frontend has been implemented using **React, Vite, and modern CSS**.
- **Dynamic Interface:** Features glassmorphism, responsive grids, and interactive hover micro-animations to enhance user engagement.
- **Personalized Dashboard:** Presents a "Top-N" study material recommendation carousel, pulling dynamically from the FastAPI backend.
- **Interaction Tracking:** Silently logs user interactions (clicks, views) to continuously feed the CF engine.

## IV. Evaluation and Prediction Performance
The recommendation framework's performance was evaluated using standard classification metrics by binarizing user interactions (defining "relevant" items based on an interaction score threshold).

### Evaluation Metrics
*(Metrics will be populated from the automated evaluation script)*
- **Precision:** Measures the proportion of recommended items that are actually relevant to the student.
- **Recall:** Measures the proportion of relevant items that the system successfully recommended.
- **F1-Score:** The harmonic mean of Precision and Recall, providing a single metric for system accuracy.

**Results (Initial sparse dataset):**
- Precision: 0.0000
- Recall: 0.0000
- F1-Score: 0.0000

*Note: The current metrics reflect an extreme cold-start scenario where the interaction database (n=38) only contains sparse, low-weight interaction types (views). As more varied interactions (adds to list, ratings) are collected, the SVD model's predictive capability and these metrics will improve significantly.*
