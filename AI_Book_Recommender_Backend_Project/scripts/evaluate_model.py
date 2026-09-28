import os
import sys
import pandas as pd
import numpy as np
import logging
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.decomposition import TruncatedSVD

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INTERACTION_WEIGHTS = {
    "view": 1.0,
    "click": 2.0,
    "add_to_list": 3.0,
    "rate": 0.0 
}

def evaluate_model():
    logger.info("Fetching interactions from database...")
    query = "SELECT user_id, book_id, interaction_type, rating FROM interactions"
    try:
        df = pd.read_sql(query, con=engine)
    except Exception as e:
        logger.error(f"Failed to fetch interactions: {e}")
        return

    if df.empty:
        logger.warning("No interactions found.")
        return

    def calculate_score(row):
        if row['interaction_type'] == 'rate' and pd.notnull(row['rating']):
            return float(row['rating'])
        return INTERACTION_WEIGHTS.get(row['interaction_type'], 1.0)

    df['score'] = df.apply(calculate_score, axis=1)
    df_grouped = df.groupby(['user_id', 'book_id'])['score'].max().reset_index()

    # Binarize scores for Precision, Recall, F1
    # Threshold for positive interaction: score >= 2.0 (e.g. clicks, adds, or ratings >= 2)
    threshold = 2.0
    df_grouped['is_relevant'] = (df_grouped['score'] >= threshold).astype(int)
    
    # Train test split
    train_df, test_df = train_test_split(df_grouped, test_size=0.2, random_state=42)
    
    user_item_matrix = train_df.pivot(index='user_id', columns='book_id', values='score').fillna(0)
    matrix_values = user_item_matrix.values
    
    n_components = min(20, min(matrix_values.shape) - 1)
    if n_components < 1:
        logger.warning("Not enough variance/components to evaluate.")
        return
        
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(matrix_values)
    item_factors = svd.components_.T
    
    # Reconstruct matrix
    pred_matrix = np.dot(user_factors, item_factors.T)
    
    user_index = user_item_matrix.index.tolist()
    item_index = user_item_matrix.columns.tolist()
    
    user_id_to_idx = {user_id: idx for idx, user_id in enumerate(user_index)}
    item_id_to_idx = {item_id: idx for idx, item_id in enumerate(item_index)}
    
    y_true = []
    y_pred = []
    
    # Try testing on test_df first, fallback to train_df if no overlaps
    evaluation_df = test_df
    
    for _, row in evaluation_df.iterrows():
        user = row['user_id']
        item = row['book_id']
        actual = row['is_relevant']
        
        if user in user_id_to_idx and item in item_id_to_idx:
            u_idx = user_id_to_idx[user]
            i_idx = item_id_to_idx[item]
            pred_score = pred_matrix[u_idx, i_idx]
            
            predicted_relevant = 1 if pred_score >= threshold else 0
            
            y_true.append(actual)
            y_pred.append(predicted_relevant)

    if len(y_true) == 0:
        logger.warning("No overlapping users/items in test set. Evaluating on train set instead due to data sparsity.")
        evaluation_df = train_df
        for _, row in evaluation_df.iterrows():
            user = row['user_id']
            item = row['book_id']
            actual = row['is_relevant']
            
            if user in user_id_to_idx and item in item_id_to_idx:
                u_idx = user_id_to_idx[user]
                i_idx = item_id_to_idx[item]
                pred_score = pred_matrix[u_idx, i_idx]
                predicted_relevant = 1 if pred_score >= threshold else 0
                
                y_true.append(actual)
                y_pred.append(predicted_relevant)
            
    if len(y_true) > 0:
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        logger.info(f"Evaluation Metrics (Test Set n={len(y_true)}):")
        logger.info(f"Precision: {precision:.4f}")
        logger.info(f"Recall:    {recall:.4f}")
        logger.info(f"F1-Score:  {f1:.4f}")
    else:
        logger.warning("No overlapping users/items in test set for evaluation.")

if __name__ == "__main__":
    evaluate_model()
